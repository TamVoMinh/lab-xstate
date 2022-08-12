import fs from 'fs'

const loadState = async(userId:Number): Promise<[string, string]> => 
    fs.existsSync(`${userId}.json`)
    ? [null, await fs.readFileSync(`${userId}.json`, 'utf8')]
    : ['state-file-not-exist' ,undefined]

const persistState = (userId:Number, stateSnapshot:any): void => {
    const writeStream = fs.createWriteStream(`${userId}.json`)
    writeStream.write(JSON.stringify(stateSnapshot,null,2))
}

export {
    loadState,
    persistState
}