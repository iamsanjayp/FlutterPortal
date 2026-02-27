FROM node:18-slim

WORKDIR /app

ENV NODE_ENV=test
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Install Chrome dependencies for Puppeteer
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Initialize project
RUN npm init -y

# Install dependencies
# puppeteer-core: use installed chrome
# jest, babel, webpack: standard tooling
RUN npm install --save-dev puppeteer-core jest jest-environment-jsdom \
    babel-jest @babel/core @babel/preset-env @babel/preset-react \
    react-test-renderer \
    webpack webpack-cli babel-loader css-loader style-loader html-webpack-plugin file-loader

# Install React Native Web stack & Navigation
RUN npm install react react-dom react-native-web \
    @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs \
    react-native-screens react-native-safe-area-context react-native-gesture-handler

# Configure
COPY .babelrc .
COPY jest.config.js .
COPY webpack.config.js .
COPY entry.js .

# Create dummy test to verify setup
RUN mkdir __tests__
RUN echo "test('setup', () => expect(true).toBe(true));" > __tests__/setup.test.js

# Pre-build to cache dependencies
RUN npx jest
