import * as debug from "debug";
import {execLLVM} from "./tools";

const LOG = debug("external-tools/llvm-opt");
const EXECUTABLE_NAME = "opt";
const OPTIMIZATIONS = "-strip-debug -disable-verify -internalize -globaldce -disable-loop-vectorization -disable-slp-vectorization -vectorize-loops=false -vectorize-slp=false -vectorize-slp-aggressive=false";
const DEFAULT_PUBLIC = "speedyJsGc,malloc,free,__errno_location,memcpy,memmove,memset,__cxa_can_catch,__cxa_is_pointer_type";

/**
 * Executes the LLVM Optimizer on the given input file
 * @param filename the input file (absolute path)
 * @param publicFunctions name of the public functions
 * @param optimizedFileName the name of the target file
 * @param level the optimization level
 * @returns the name of the optimized file
 */
export function optimize(filename: string, publicFunctions: string[], optimizedFileName: string, level: "0" | "1" | "2" | "3" | "z" | "s") {
    const publicApi = publicFunctions.concat(DEFAULT_PUBLIC).join(",");

    LOG(`Optimizing file ${filename}`);
    // child_process.execSync(`opt ${bcFileName} -o ${bcFileName} `);
    execLLVM(EXECUTABLE_NAME, `"${filename}" -o "${optimizedFileName}" -internalize-public-api-list="${publicApi}" ${OPTIMIZATIONS} -O${level}`);

    return optimizedFileName;
}
