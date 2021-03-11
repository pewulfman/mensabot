import * as util from 'util';
import {configs as conf} from '../configs';
const exec = util.promisify(require('child_process').exec);



async function dump_db() {
	try {
		const cmd = 'mysqldump -u ' + conf.mysql.user + ' -p' + conf.mysql.password + ' --no-tablespaces ' + conf.mysql.database + ' > mensabot_dump.sql';
		const { stdout, stderr } = await exec(cmd);
		console.log('stdout:', stdout);
		console.log('stderr:', stderr);
	} catch (err) {
		console.error(err);
	}
}


dump_db();
