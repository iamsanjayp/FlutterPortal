import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import util from 'util';

const execPromise = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import os from 'os';

const BASE_DIR = __dirname;
// Use OS temp dir to completely avoid nodemon watching files
const RUNS_DIR = path.join(os.tmpdir(), 'mobiledev_portal_runs');

// Ensure runs directory exists
if (!fs.existsSync(RUNS_DIR)) {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  console.log('[Docker] Created runs directory:', RUNS_DIR);
}

// Ensure screenshot.js exists in the docker dir to be copied if needed? 
// Or we write it dynamically. Writing dynamically is safer to keep logic in one place.

// Webpack config to produce bundle.js
const WEBPACK_CONFIG = `
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './entry.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/inline',
      },
    ],
  },
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
    },
    extensions: ['.web.js', '.js', '.jsx', '.png', '.jpg'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      templateContent: \`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body, html, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; }
              #root { display: flex; flex-direction: column; height: 100%; }
            </style>
          </head>
          <body>
            <div id="root"></div>
          </body>
        </html>
      \`,
      inject: false, // We will inject manually to ensure it's inline if needed, or rely on bundle.js being served. 
                     // Users want "simulation", so strictly speaking, we can just return the HTML with the script INLINED.
    }),
  ],
  performance: { hints: false },
};
`;

const ENTRY_CONTENT = `
import { AppRegistry } from 'react-native';
import App from './App';

// Register the app
AppRegistry.registerComponent('App', () => App);

// Run the app on web
AppRegistry.runApplication('App', {
  initialProps: {},
  rootTag: document.getElementById('root')
});
`;

export async function executeReactNativeDocker(codeOrFiles, options = {}) {
  const { mode = 'PREVIEW', name } = options; // PREVIEW (Interactive) or TEST (Jest)
  const runId = uuidv4();
  const workDir = path.join(RUNS_DIR, runId);
  const containerName = `rn-runner-${runId}`;

  // Log start
  console.log(`[Docker] Starting execution ${runId}`);

  try {
    // 0. CHECK DOCKER
    try {
      await execPromise('docker info', { timeout: 5000 });
    } catch (dockerErr) {
      console.error('Docker check failed:', dockerErr.message);
      return {
        success: false,
        message: 'Docker is not running',
        output: 'Critical Error: Docker Desktop is not running on the server.\nPlease ask the administrator to start Docker.',
        duration: 0
      };
    }

    fs.mkdirSync(workDir, { recursive: true });

    // 1. Prepare files locally
    if (typeof codeOrFiles === 'object' && codeOrFiles !== null) {
        // MULTI-FILE MODE
        for (const [filename, content] of Object.entries(codeOrFiles)) {
            const filePath = path.join(workDir, filename);
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(filePath, content);
        }
    } else {
        // SINGLE-FILE MODE (Legacy support)
        fs.writeFileSync(path.join(workDir, 'App.js'), codeOrFiles);
    }

    // Always overwrite entry.js and webpack.config.js to ensure environment is correct
    fs.writeFileSync(path.join(workDir, 'entry.js'), ENTRY_CONTENT);
    fs.writeFileSync(path.join(workDir, 'webpack.config.js'), WEBPACK_CONFIG);
    
    // fs.appendFileSync(logFile, `[${new Date().toISOString()}] Files prepared ${runId}\n`);

    // 2. Start container 
    console.log(`[Docker] Starting container: ${containerName}`);
    try {
      await execPromise(`docker run -d --rm --name ${containerName} --memory=2g react-native-runner sleep infinity`, { 
        timeout: 30000 
      });
      // fs.appendFileSync(logFile, `[${new Date().toISOString()}] Container started ${runId}\n`);
    } catch (containerErr) {
      // throw new Error(`Container start failed: ${containerErr.message}`);
      // Handle gracefully
      return {
        success: false,
        message: 'Failed to start Docker container',
        output: `Error: ${containerErr.message}\nCheck if Docker Image 'react-native-runner' is built.`,
        duration: 0
      };
    }

    // 3. Copy files to container
    try {
      await execPromise(`docker cp "${workDir}/." ${containerName}:/app/`, { timeout: 10000 });
      // fs.appendFileSync(logFile, `[${new Date().toISOString()}] Files copied ${runId}\n`);
    } catch (copyErr) {
      console.error(`File copy failed ${runId}: ${copyErr.message}`);
      throw new Error(`File copy failed: ${copyErr.message}`);
    }

    let result = {
      success: false,
      message: 'Unknown error',
      output: '',
      html: null,
      duration: 0
    };

    const startTime = Date.now();

    if (mode === 'PREVIEW') {
      try {
        // Run Webpack
        // Increased timeout to 120s
        console.log(`[Docker] Running webpack for ${runId}`);
        const webpackCmd = `docker exec ${containerName} npx webpack`;
        await execPromise(webpackCmd, { timeout: 120000 });
        
        // fs.appendFileSync(logFile, `[${new Date().toISOString()}] Webpack done ${runId}\n`);

        // Copy dist back
        const distDir = path.join(workDir, 'dist');
        if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);
        
        await execPromise(`docker cp ${containerName}:/app/dist/. "${distDir}/"`, { timeout: 10000 });

        // Read the generated files
        const htmlPath = path.join(distDir, 'index.html');
        const bundlePath = path.join(distDir, 'bundle.js');

        if (fs.existsSync(htmlPath) && fs.existsSync(bundlePath)) {
          let htmlContent = fs.readFileSync(htmlPath, 'utf8');
          const bundleContent = fs.readFileSync(bundlePath, 'utf8');

          // Inline the script
          // HtmlWebpackPlugin (with inject: false) won't add the script tag, so we add it manually at the end of body/html
          // But if it DID add it, we'd replace it. 
          // Our config has inject: false, so we just append.
          const scriptTag = `<script>${bundleContent}</script>`;
          htmlContent = htmlContent.replace('</body>', `${scriptTag}</body>`);

          result.success = true;
          result.html = htmlContent;
          result.message = 'Simulation generated successfully';
        } else {
          result.message = 'Build failed: Output files not found';
          try {
             const logs = await execPromise(`docker logs ${containerName}`);
             result.output = logs.stdout || logs.stderr;
          } catch(e) {}
        }

      } catch (err) {
        result.output = err.message + '\\n' + (err.stdout || '') + '\\n' + (err.stderr || '');
        result.message = 'Build failed during webpack';
      }

    } else if (mode === 'TEST') {
      // Placeholder for Jest logic
      result.success = true; 
      result.message = 'Jest Not Implemented Yet';
    }

    result.duration = Date.now() - startTime;

    // 4. Cleanup container
    try { await execPromise(`docker rm -f ${containerName}`, { timeout: 10000 }); } catch (e) {}

    // Cleanup local files (optional, maybe keep for debug?)
    // fs.rmSync(workDir, { recursive: true, force: true });

    return result;

  } catch (err) {
    console.error(`[CRASH] ${runId}: ${err.message}`);
    
    // Attempt cleanup
    try { await execPromise(`docker rm -f ${containerName}`, { timeout: 10000 }); } catch (e) {}
    
    return {
      success: false,
      message: 'System error during execution',
      output: err.message,
      duration: 0
    };
  }
}
