const fs = require('fs');

function generateRandomKey() {
    const randomString = [...Array(11)].map(() => (Math.random() * 36 | 0).toString(36)).join('');
    return `"eyecore-${randomString}": {"type": "once", "value": 1}`;
}

function generateKeys(count) {
    const keys = [];
    for (let i = 0; i < count; i++) {
        const key = generateRandomKey();
        keys.push(key);
    }
    return keys;
}

const numberOfKeys = 550;
const keys = generateKeys(numberOfKeys);

const jsonContent = `{ ${keys.join(',')} }`;

fs.writeFile('keys1.json', jsonContent, 'utf8', (err) => {
    if (err) {
        console.error('Error writing JSON file:', err);
    } else {
        console.log('Keys have been saved to keys1.json');
    }
});
