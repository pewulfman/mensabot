import { URL } from "url";
import { configs } from "./configs"


export function generateCode () {
    return Math.random().toString(36).substr(2);
}

export function generateUrl (mensaId : number, code : string | undefined) {
    if (! code) { code = generateCode ()};
    const url = new URL (configs.server.baseUrl + configs.server.validation_path);
    url.searchParams.append ("mid",mensaId.toString());
    url.searchParams.append ("code",code);
    return url.href;
}