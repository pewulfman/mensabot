function assert_exist (name : string) : any {
	let arg = eval ("process.env."+name);
	if (!arg) {
		console.log (`environmen variable ${name} is undefined`)
		process.exit();
	}
	else return arg
}

export const configs = {
	botToken: assert_exist ("BOT_TOKEN"),
	botAdmin: {
		name:  assert_exist ("ADMIN_NAME"),
		email: assert_exist ("ADMIN_MAIL"),
	},
	mensa_fr_db : {
		userid:   assert_exist ("MENSA_ID"),
		password: assert_exist ("MENSA_PASS"),
		url:      assert_exist ("MENSA_URL")
	},
	mensa_inter_db : {
		userid:   assert_exist ("MENSA_INTER_ID"),
		password: assert_exist ("MENSA_INTER_PASS"),
		url :     assert_exist ("MENSA_INTER_URL")
	},
	smtp : {
		host:     assert_exist ("SMTP_HOST"),
		user:     assert_exist ("SMTP_USER"),
		password: assert_exist ("SMTP_PASS") 
	},
	server : {
		baseUrl :         assert_exist ("BASE_URL"),
		validation_path : assert_exist ("VALIDATION_PATH")
	}
}

