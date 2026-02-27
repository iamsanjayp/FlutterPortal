import pool from '../src/config/db.js';

// Simple SVG placeholders encoded as base64
// Counter App: Green + Red buttons
const counterSvg = `<svg width="300" height="600" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#f8f9fa"/>
<text x="50%" y="40%" font-family="Arial" font-size="80" fill="#333" text-anchor="middle">0</text>
<circle cx="35%" cy="60%" r="40" fill="#ef4444"/>
<text x="35%" y="60%" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy="15">-</text>
<circle cx="65%" cy="60%" r="40" fill="#22c55e"/>
<text x="65%" y="60%" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy="15">+</text>
<text x="50%" y="20%" font-family="Arial" font-size="24" fill="#666" text-anchor="middle">Counter App</text>
</svg>`;

// Profile Card: Avatar + Details
const profileSvg = `<svg width="300" height="600" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#f8f9fa"/>
<rect x="30" y="150" width="240" height="300" rx="20" fill="white" stroke="#e5e7eb" stroke-width="2"/>
<circle cx="150" cy="150" r="50" fill="#3b82f6" stroke="white" stroke-width="4"/>
<text x="150" y="240" font-family="Arial" font-size="24" font-weight="bold" fill="#1f2937" text-anchor="middle">Sarah Jones</text>
<text x="150" y="270" font-family="Arial" font-size="16" fill="#6b7280" text-anchor="middle">UX Designer</text>
<rect x="60" y="300" width="80" height="30" rx="15" fill="#dbeafe"/>
<text x="100" y="320" font-family="Arial" font-size="12" fill="#1e40af" text-anchor="middle">UI Design</text>
<rect x="160" y="300" width="80" height="30" rx="15" fill="#dbeafe"/>
<text x="200" y="320" font-family="Arial" font-size="12" fill="#1e40af" text-anchor="middle">React</text>
<rect x="50" y="400" width="90" height="40" rx="8" fill="#3b82f6"/>
<text x="95" y="425" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Follow</text>
<rect x="160" y="400" width="90" height="40" rx="8" fill="white" stroke="#d1d5db"/>
<text x="205" y="425" font-family="Arial" font-size="14" fill="#374151" text-anchor="middle">Message</text>
</svg>`;

const counterBase64 = `data:image/svg+xml;base64,${Buffer.from(counterSvg).toString('base64')}`;
const profileBase64 = `data:image/svg+xml;base64,${Buffer.from(profileSvg).toString('base64')}`;

async function updateImages() {
  try {
    console.log('🖼️  Updating Problem Sample Images...\n');

    // Update Counter App (2004)
    await pool.query('UPDATE problems SET sample_image = ? WHERE id = 2004', [counterBase64]);
    console.log('✅ Updated Counter App (ID 2004) image');

    // Update Profile Card (9001)
    await pool.query('UPDATE problems SET sample_image = ? WHERE id = 9001', [profileBase64]);
    console.log('✅ Updated Profile Card (ID 9001) image');

  } catch (error) {
    console.error('❌ Error updating images:', error);
  } finally {
    await pool.end();
  }
}

updateImages();
