function assert_exist<T> (arg : T | undefined) : T {
	if (!arg) {
		console.log (arg + "is undefined")
		process.exit();
	}
	else return arg
}

export const configs = {
	botToken: assert_exist (process.env.BOT_TOKEN),
	botAdmin: {
		name:  assert_exist (process.env.ADMIN_NAME),
		email: assert_exist (process.env.ADMIN_MAIL),
	},
	mensa_fr_db : {
		userid:   assert_exist (process.env.MENSA_ID),
		password: assert_exist (process.env.MENSA_PASS),
		headless: true,
		url:      assert_exist (process.env.MENSA_URL)
	},
	mensa_inter_db : {
		userid:   assert_exist (process.env.MENSA_INTER_ID),
		password: assert_exist (process.env.MENSA_INTER_PASS),
		url :     assert_exist (process.env.MENSA_INTER_URL)
	}
}

