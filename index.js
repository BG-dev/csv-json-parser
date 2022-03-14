#!/usr/bin/env node 

const fs = require("fs");
const { Transform } = require("stream");
const { pipeline } = require("stream/promises");

let isHeaders = true;
let headers;

class CsvTransform extends Transform{
  constructor(separator){
    super()
    this.separator = separator || ','
  }

  _transform(chunk, encoding, callback){
    const dataRows = chunk.toString().split('\r')  
    if(isHeaders){
        headers = dataRows[0].split(this.separator)
        dataRows.shift()
        this.push('[\n')
    }

    dataRows.map(element => {
        const jsonObject = {}
        const csvLine = element.split(this.separator)
  
        headers.map((header, index) => {
          jsonObject[header] = csvLine[index]
        })
        
        if(!isHeaders) {
          this.push(',\n')
        } else {
          isHeaders = false
        }
        this.push(JSON.stringify(jsonObject, null, 4))
    })
    callback();
  }

  _flush(callback){
    this.push(']')
    callback
  }
}

async function createPipeline(readableStream, transformStream, writeableStream){
  if(!readableStream || !transformStream || !writeableStream) 
    throw new SyntaxError('Incorrect data')

  await pipeline(
    readableStream,
    transformStream,
    writeableStream
  )
}

function addBracketsToFile(resultFile, startBracketStream){
  if(!resultFile) 
    throw new SyntaxError('Incorrect file data')
  
  startBracketStream.write('[')
  startBracketStream.end()
  fs.appendFileSync(resultFile, '\n]')
}

function getArgumentsFromTerminal () {
  const dataFromConsole = process.argv
      .slice(2, process.argv.length)
  
  const arguments = {}
  for(let i = 0; i < dataFromConsole.length; i += 2){
    const key = dataFromConsole[i].slice(2, dataFromConsole[i].length)
    const value = dataFromConsole[i+1]
    arguments[key] = value
  }
  return arguments;
}

async function transformCsvToJson(sourceFile, resultFile, separator = ','){
  if(!sourceFile || !resultFile)
    throw new SyntaxError('Incorrect information')

  const readStream = fs.createReadStream(sourceFile);
  const writeStream = fs.createWriteStream(resultFile);

  const transform = new CsvTransform(separator)

  await createPipeline(readStream, transform, writeStream)
}

async function main(){
  try {
    const arguments = getArgumentsFromTerminal()

    const { sourceFile, resultFile, separator } = arguments
  
    await transformCsvToJson(sourceFile, resultFile, separator)

  } catch (error) {
    console.log(error.message)
  }
}

main()
