export const configs = {
	botToken: process.env.BOT_TOKEN,
	mysql: {
		host: '127.0.0.1',
		user: 'mensabot',
		password: '***',
		database: 'mensabot'
	},
	botAdmin: {
		name:  process.env.ADMIN_NAME,
		email: process.env.ADMIN_MAIL
	},
	mensa_fr_db : {
		userid:   process.env.MENSA_ID,
		password: process.env.MENSA_PASSWORD,
		headless: true,
		url:      process.env.MENSA_URL
	},
	mensa_inter_db : {
		userid:   process.env.MENSA_INTER_ID,
		password: process.env.MENSA_INTER_PASS,
		url :     process.env.MENSA_INTER_URL
	}
}

