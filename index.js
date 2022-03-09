#!/usr/bin/env node 

const fs = require("fs");
const { Transform } = require("stream");
const { pipeline } = require("stream/promises");

let isHeaders = false;
let headers;

function transformData(chunk, encoding, callback){
  const dataRows = chunk.toString().split('\r')  
  if(!isHeaders){
      isHeaders = true
      headers = dataRows[0].split(',')
      dataRows.shift()
  }
  dataRows.map(element => {
      const jsonObject = {}
      const csvLine = element.split(',')

      headers.map((header, index) => {
        jsonObject[header] = csvLine[index]
      })
      
      this.push(',\n' + JSON.stringify(jsonObject, null, 4))
  })
  callback();
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
  const startBracketStream = fs.createWriteStream(resultFile);

  const transform = new Transform({
    transform: transformData,
  });
  
  await createPipeline(readStream, transform, writeStream)
  addBracketsToFile(resultFile, startBracketStream)
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
