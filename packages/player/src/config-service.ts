import {Context} from "effect";

export class Config extends Context.Tag('ConfigService')<
    Config, { readonly name: string }>() {
}
