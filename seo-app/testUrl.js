const config = require("./config");
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const {google} = require('googleapis');
const fs = require('fs');
const express = require('express');
const URL = require('url');

/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
function execShellCommand(cmd) {
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
            }
            resolve(stdout ? stdout : stderr);
        });
    });
}



const app = express();

app.use((req, res, next) => {
    if (req.query.customtoken !== config.customToken && req.path !== '/getTokens') {
        res.send('Invalid token!');
    } else {
        next();
    }
});

app.use('/semrush-keywords', express.static('../semrush-keywords'));

app.use('/screaming-frog', express.static('../screaming-frog'))

// app.get('/hello', (req, res) => {
//     res.send('Hello !');
// });

async function setOAuthCreds() {
    const oauth2Client = new google.auth.OAuth2(...Object.values(config.oauth2Credentials));
    let tokens = await fs.promises.readFile('tokens.json', 'utf8');
    tokens = JSON.parse(tokens);
    oauth2Client.setCredentials(tokens);
    google.options({auth: oauth2Client});
}

async function mobileFriendly(url) {
    const apiEndpoint = `https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run?key=${config.gloudAPIkey}`;
    const data = {
        'url': url
    }
    const options = {
        'method': 'post',
        'contentType': 'application/json',
        // Convert the JavaScript object to a JSON string.
        'body': JSON.stringify(data)
    };

    const resp = await fetch(apiEndpoint, options).then(resp => resp.json()).then(json => json.mobileFriendliness);
    return ['MobileFriendliness', resp];
}

async function pageSpeed(url, type) {
    const apiEndpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${config.gloudAPIkey}&strategy=`;
    const resp = await fetch(apiEndpoint + type).then(resp => resp.json()).then(json => json.lighthouseResult.categories.performance.score);
    return [`pageSpeed${type}`, resp];
}

async function redirectCheck(url) {
    // return true if redirect exist
    const apiEndpoint = `https://api.redirect-checker.net/?url=${url}&timeout=5&maxhops=10&meta-refresh=1&format=json`;
    const resp = await fetch(apiEndpoint).then(resp => resp.json()).then(json => json.data[0].response.info.redirect_url !== '');
    return [`redirectCheck`, resp];
}

async function webPageTestCheck(url) {
    let resp;
    try {
        const browser = await puppeteer.launch({args: ['--no-sandbox']});
        const page = await browser.newPage();
        await page.goto(`http://${config.webPageTestServerIP}`);
        await page.type('#url', url);
        await page.click('#start_test-container > p > input');
        await page.waitForSelector('#grades', {timeout: 3 * 60 * 1000});
        resp = await page.evaluate(() => {
            let data = [];
            document.querySelectorAll('#grades li').forEach(e => data.push([e.className, e.querySelector("h2").className]));
            return data;
        });
        await browser.close();
    } catch (e) {
        resp = `error: ${e.message}`;
    }
    return ['webPageTestCheck', resp];
}

function googleOAuth2() {
    const oauth2Client = new google.auth.OAuth2(...Object.values(config.oauth2Credentials));
    app.get('/generateUrlToAuth', (req, res) => {
        const scopes = [
            'https://www.googleapis.com/auth/webmasters.readonly',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/business.manage'
        ];

        const url = oauth2Client.generateAuthUrl({
            // 'online' (default) or 'offline' (gets refresh_token)
            access_type: 'offline',
            // If you only need one scope you can pass it as a string
            scope: scopes,
            // To get refresh token every time
            prompt: "consent"
        });
        res.send(`<a href="${url}">Click to auth with google OAuth</a>`);
    });

    app.get('/getTokens', async (req, res) => {
        try {
            if (!req.query.code) {
                res.send('Fail!');
                return;
            }
            const {tokens} = await oauth2Client.getToken(req.query.code);
            fs.writeFile("tokens.json", JSON.stringify(tokens), console.log);
            res.send(`tokens <pre>${JSON.stringify(tokens)}</pre>You may close this window!`);
        } catch (e) {
            res.send('Fail, error!');
        }
    });
}

async function averagePosition(url) {
    let resp;
    try {
        Date.prototype.yyyymmdd = function () {
            const mm = this.getMonth() + 1; // getMonth() is zero-based
            const dd = this.getDate();

            return [this.getFullYear(),
                (mm > 9 ? '' : '0') + mm,
                (dd > 9 ? '' : '0') + dd
            ].join('-');
        };


        const datePre = new Date();
        datePre.setMonth(datePre.getMonth() - 3);


        resp = (await google.webmasters('v3').searchanalytics.query({
            siteUrl: url,
            requestBody: {
                startDate: datePre.yyyymmdd(),
                endDate: (new Date()).yyyymmdd(),
            },
        })).data.rows[0].position;
    } catch (e) {
        resp = `error: ${e.message}`;
    }
    return ['averagePosition', resp];
}

async function mozCheck(url) {
    const apiEndpoint = 'https://lsapi.seomoz.com';

    const resp = await fetch(apiEndpoint + '/v2/url_metrics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "Authorization": "Basic " + Buffer.from(config.mozAccessId + ":" + config.mozSecretKey, "utf8").toString("base64")
        },
        body: JSON.stringify({"targets": [url]})
    }).then(resp => resp.json()).then(json => json.results[0].domain_authority);

    return ['mozCheckDomainAuthority', resp];
}

async function semRush(url) {
    let resp;
    const request = (path, query, json = true) => {
        let response = fetch(`https://api.semrush.com${path}?key=${config.semRushApiKey}&${query}`);
        return json ? response.then(resp => resp.json()) : response.then(resp => resp.text());
    };
    try {
        const projects = await request(`/management/v1/projects`);
        const project = projects.filter(project => url.includes(project.url))[0];
        const keywordsData = await request('', `type=domain_organic&domain=${project.url}&database=us`, false);
        const path = `semrush-keywords/${URL.parse(url).hostname}.csv`;
        await fs.promises.writeFile(`../${path}`, keywordsData);
        const keywords = `http://${config.serverIp}:${config.port}/${path}?customtoken=valerii15298`;
        resp = await request(`/reports/v1/projects/${project.project_id}/siteaudit/info`);
        resp = [
            [`quality`, resp?.current_snapshot.quality.value],
            [`errors`, resp.errors],
            [`warnings`, resp.warnings],
            [`notices`, resp.notices],
            [`keywords`, keywords]
        ];
    } catch (e) {
        resp = `error: ${e.message}`;
    }
    return ['semRushCheck', resp];
}

async function clickyCheck(siteId, siteKey) {
    const endpoint = `http://api.clicky.com/api/stats/4?site_id=${siteId}&sitekey=${siteKey}&output=json&type=visitors`;
    const request = async (daysRange) =>
        (await fetch(`${endpoint}&date=last-${daysRange}-days`).then(resp => resp.json()))[0].dates[0].items[0].value;
    const last30days = await request(30);
    const last365days = await request(365);
    return [
        'clickyCheck', [
            [`last30days`, last30days],
            [`last365days`, last365days]
        ]
    ];
}

async function myBusinessCheck(url) {
    let resp;
    try {
        const endpoint = 'https://mybusiness.googleapis.com/v4';
        const access_token = await getToken('tokens.json');
        // console.log(access_token);
        const headers = {
            // 'Client_id': config.oauth2Credentials.clientId,
            // 'Client_secret': config.oauth2Credentials.clientSecret,
            'Authorization': 'Bearer ' + access_token,
            // 'Authorization': 'OAuth ' + access_token,
        };
        const request = (path = '', query = '') => fetch(`${endpoint}${path}?${query}`, {
            method: 'GET',
            headers: headers
        });

        const accounts = await request('/accounts?pageSize=1');
        resp = await accounts.text();
        // let account = accounts.accounts[0].name;
        //
        // let locations = await request(`/${account}/locations?filter=websiteUrl=${url}&pageSize=2`);
        // let location = locations.locations[0].name;
        //
        // let reviews = await request(`/${location}/reviews?pageSize=1`);
        //
        // const averageRating = reviews.averageRating;
        // const totalReviewCount = reviews.totalReviewCount;
        // resp = [
        //     ['averageRating', averageRating],
        //     ['totalReviewCount', totalReviewCount]
        // ];
    } catch (e) {
        resp = `error: ${e.message}`;
    }
    return ['myBusinessCheck', resp];
}

async function screamingFrogCheck(url) {
    let resp;
    try {
        const domain = URL.parse(url).hostname;
        //extract bad urls
        const cmd = `bash screaming-script.sh "${domain}"`;
        await execShellCommand(cmd);
        resp = [
            ['bad_internal', `http://${config.serverIp}:${config.port}/screaming-frog/${domain}/bad_internal.csv?customtoken=valerii15298`],
            ['bad_external', `http://${config.serverIp}:${config.port}/screaming-frog/${domain}/bad_external.csv?customtoken=valerii15298`]
        ]
    } catch (e) {
        resp = `error: ${e.message}`;
    }
    return ['screamingFrogCheck', resp];
}


async function getToken(tokenPath) {
    const endpoint = 'https://accounts.google.com/o/oauth2/token';
    const tokens = JSON.parse(await fs.promises.readFile(tokenPath, 'utf8'));
    // console.log(tokens);
    const dateExpiry = tokens.expiry_date;
    const dateNow = Date.now();
    if (dateNow > (dateExpiry - 200)) {
        console.log('refresh');
        const refreshToken = tokens.refresh_token;
        const data = `client_id=${config.oauth2Credentials.clientId}` +
            `&client_secret=${config.oauth2Credentials.clientSecret}` +
            `&refresh_token=${refreshToken}` +
            `&grant_type=refresh_token`;
        const newAccessTokenJSON = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: data
        }).then(resp => resp.json());
        // console.log(newAccessTokenJSON);
        tokens.access_token = newAccessTokenJSON.access_token;
        tokens.expiry_date = newAccessTokenJSON.expires_in * 1000 + dateNow;
        tokens.token_type = newAccessTokenJSON.token_type;
        await fs.promises.writeFile(tokenPath, JSON.stringify(tokens));
        // console.log(tokens);
    }
    return tokens.access_token;
}

async function test(req, res) {
    let response;
    try {
        await setOAuthCreds();
        const testURL = req.query.url;
        const spreadSheetId = req.query.spreadSheetId;
        const clickySiteId = req.query.clickySiteId;
        const clickySiteKey = req.query.clickySiteKey;
        // console.log(req.query);
        if (!testURL || !spreadSheetId || !clickySiteId || !clickySiteKey) {
            res.send('Invalid query parameters!');
            return;
        }
        console.log('Started');
        const results = await Promise.all([
            mobileFriendly(testURL),
            pageSpeed(testURL, 'desktop'),
            pageSpeed(testURL, 'mobile'),
            redirectCheck(testURL).catch(e => ['redirectCheck', `error: ${e.message}`]),
            webPageTestCheck(testURL),
            mozCheck(testURL),
            averagePosition(testURL),
            semRush(testURL),
            clickyCheck(clickySiteId, clickySiteKey),
            myBusinessCheck(testURL),
            screamingFrogCheck(testURL),
        ]);

        let data = [];
        results.forEach(el => {
            if (Array.isArray(el[1])) {
                el[1].forEach(prop => data.push([el[0] + '_' + prop[0], prop[1]]));
            } else {
                data.push(el);
            }
        });


        const sheets = google.sheets({version: 'v4'});
        const request = {
            spreadsheetId: spreadSheetId,
            range: 'Sheet1!A4:B30',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: data,
            },
        };
        response = (await sheets.spreadsheets.values.update(request)).data;
    } catch (e) {
        console.log(e);
        response = e.message;
    }
    res.send(JSON.stringify({status: "done", response: response}));
}

app.get('/', test);
googleOAuth2();
app.listen(config.port, '0.0.0.0');

