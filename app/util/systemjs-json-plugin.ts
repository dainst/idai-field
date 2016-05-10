/*
  JSON plugin
*/


export function translate(load) {
	if (this.builder)
		return 'module.exports = ' + JSON.stringify(JSON.parse(load.source));
}

export function instantiate(load) {
	if (!this.builder)
		return JSON.parse(load.source);
}
