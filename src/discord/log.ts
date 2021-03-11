const colors = require('colors/safe');
const moment = require('moment');

const conf = require('../configs.ts');

// that object will be exported (commonJS module patern)


// gives memory used in Mega-Bytes
function memoryUsed() {
	var memory = Math.round(process.memoryUsage().heapUsed /1024 /1024 * 100).toString();
	return memory.slice(0,-2) + "." + memory.slice(-2) + "MB";
}


function logger(msg) {
	console.log(moment().format('YYYY-MM-DD HH:mm:ss'), colors.bold(memoryUsed()), msg);
}


export function msgout(to, msg) {
    logger(colors.green('[>> ' + to + ']') + ' ' + msg);
}

export function msgin(from, msg) {
    logger(colors.yellow('[' + from + ' >>]') + ' ' + msg);
}

export function debug (msg) {
	logger(colors.cyan(msg));
}

export function warning (msg) {
	logger( colors.yellow("[WARNING] ") + msg);
}

export function error (msg, e) {
	// console.log(e);
	logger( colors.bold.red("[ERROR] ") + msg + (e || ''));
}
