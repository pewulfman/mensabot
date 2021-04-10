function assert_exists (name : string) : any {
	let arg = eval ("process.env."+name);
	if (!arg) {
		console.log (`environmen variable ${name} is undefined`)
		process.exit();
	}
	else return arg
}

export const configs = {
	botToken: assert_exists ("BOT_TOKEN"),
	botAdmin: {
		name:  assert_exists ("ADMIN_NAME"),
		email: assert_exists ("ADMIN_MAIL"),
	},
	mensa_fr_db : {
		userid:   assert_exists ("MENSA_ID"),
		password: assert_exists ("MENSA_PASS"),
		url:      assert_exists ("MENSA_URL")
	},
	mensa_inter_db : {
		userid:   assert_exists ("MENSA_INTER_ID"),
		password: assert_exists ("MENSA_INTER_PASS"),
		url :     assert_exists ("MENSA_INTER_URL")
	},
	server : {
		baseUrl :         assert_exists ("BASE_URL"),
		port    :		  process.env.PORT || 4000,
		validation_path : assert_exists ("VALIDATION_PATH")
	},
	sendgrid : {
		api_key:  assert_exists ("SENDGRID_API_KEY"),
		user:     assert_exists ("SENDGRID_USERNAME"),
		password: assert_exists ("SENDGRID_PASSWORD") 
	},
	sentry : {
		dsn : assert_exists ("SENTRY_DSN")
	}
}

