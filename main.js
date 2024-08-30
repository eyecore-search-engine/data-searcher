const express = require('express');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const app = express();
const PORT = 80;

// Eyecore klasöründeki dosyaların dinamik olarak alınması
const directoryPath = 'C:\\Users\\Administrator\\Desktop\\eyecore';

// Keys array
const validKeys = ['key1', 'key2', 'key3', 'satake31', 'yarakneys', 'wanexia', 'galaxydev', 'metxh'];

// Object to keep track of last searched line in each file
const lastSearchedLine = {};

// Fonksiyon: Belirtilen dizindeki tüm dosyaları alır
function getFilesFromDirectory(dirPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(dirPath, (err, files) => {
            if (err) {
                reject(err);
            } else {
                // Sadece strippedb_ ile başlayan dosyaları filtreleyin
                const filteredFiles = files.filter(file => file.startsWith('strippedb_')).map(file => path.join(dirPath, file));
                resolve(filteredFiles);
            }
        });
    });
}

// Middleware: Key doğrulama
function validateKey(req, res, next) {
    const key = req.query.key;
    if (!key || !validKeys.includes(key)) {
        return res.status(401).send('Unauthorized Key');
    }
    console.log(`Key used: ${key}`);
    next();
}

app.use('/lookup', validateKey);

// Dosya içeriğinden belirli bir domain'i aramak için fonksiyon
async function searchDomainInFile(filePath, domain, startLine = 0) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        const matchingLines = [];
        let currentLine = 0;

        // İlk arama, önceki sorgudan kaldığı yerden başlar
        rl.on('line', (line) => {
            if (currentLine >= startLine && line.includes(domain)) {
                const parts = line.split('#EYECORE').map(part => part.trim());
                parts.forEach(part => matchingLines.push(part));
            }
            currentLine++;
        });

        rl.on('close', () => resolve(matchingLines));
        rl.on('error', reject);
    });
}

// Rastgele dosya seçimi ve arama işlemi
app.get('/lookup/:domain', async (req, res) => {
    const domain = req.params.domain;
    const key = req.query.key; // Kullanılan key'i al
    const limit = 200;

    console.log(`Query for domain: ${domain} using key: ${key}`); // Key ve domain'i print et

    try {
        const files = await getFilesFromDirectory(directoryPath);

        if (files.length === 0) {
            return res.status(500).send('No valid files found in directory');
        }

        let matchingLines = [];
        let totalFound = 0;

        // Dosyaları karıştır
        files.sort(() => Math.random() - 0.5);

        for (const file of files) {
            if (totalFound >= limit) {
                break;
            }

            // Önceki sorgudan kaldığı yerden başlayacak
            const startLine = lastSearchedLine[file] || 0;
            const lines = await searchDomainInFile(file, domain, startLine);

            lines.forEach(line => {
                if (totalFound < limit) {
                    matchingLines.push(line);
                    totalFound++;
                }
            });

            // Dosya sonundaki satırı hatırlayın
            lastSearchedLine[file] = startLine + lines.length;
        }

        if (matchingLines.length === 0) {
            return res.status(404).send(`No lines found containing domain: ${domain}`);
        }

        // JSON formatında çıktı
        const jsonOutput = matchingLines.map(line => {
            const parts = line.split(':');
            return parts.join(':');
        });

        res.json(jsonOutput);
    } catch (err) {
        console.error('Error accessing directory', err);
        res.status(500).send('Error accessing directory');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
