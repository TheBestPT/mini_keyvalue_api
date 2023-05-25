const express = require('express')
const cors = require('cors')
const fs = require('fs')
const app = express()
const config = require('./config.json')
app.use(cors())

//For requests with body
const bodyParser = require('body-parser')
const multer = require('multer') // v1.0.5
const upload = multer() // for parsing multipart/form-data

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

function authChecker(req, res, next) {
    const auth = JSON.parse(fs.readFileSync('./whitelist.json'))
    const access = auth.filter((e) => { return e == req.headers.authorization })
    if (access.length != 0) {
        next();
    } else {
       res.end('Access Forbiden')
    }
}

app.use(authChecker);

app.listen(config.port, () => {
    console.log(`Listening on port: ${config.port}`)
})


app.get('/test', (req, res) => {
    res.json({response: 'Ola'})
})

app.get('/collections/:collection', (req, res) => {
    const collectionName = req.params.collection
    try{
        if(!fs.existsSync(`./collections/${collectionName}`)){
            res.status(400).json({error: 'Collection not found ou non existing.'})
            return //prevent from continuing
        }
        const files = fs.readdirSync(`./collections/${collectionName}`)
        console.log(files)
        let items_collection = files.length
        let created_at = createdDate(`./collections/${collectionName}`)
        res.json({message: 'Collection found', items_collection, created_at})
    }catch(e){
        console.log(e)
        res.status(400).json({error: 'Collection not found ou non existing.'})
    }
})

app.delete('/collections/:collection', (req, res) => {
    const collectionName = req.params.collection
    try{
        fs.rmSync(`./collections/${collectionName}`, { recursive: true, force: true })
        res.json({response: 'Deleted with sucess.'})
    }catch(e){
        console.log(e)
        res.status(400).json({error: 'Collection not found ou non existing.'})
    }
})


app.post('/collections', (req, res) => {
    const collectionName = req.body.collectionName
    if(!collectionName) {
        res.status(400).json({error: 'No collection name'})
    }
    const cleanedFileName = collectionName.replace(/[^\w\s.-]/gi, '')
    if(fs.existsSync(`./collections/${cleanedFileName}`)){
        res.status(400).json({error: 'The collection exists.'})
        return
    }
    try{
        fs.mkdirSync(`./collections/${cleanedFileName}`)
        res.json({message: `${cleanedFileName} created.`})
    }catch(e){
        console.log(e)
        res.status(400).json({error: 'Collection not found ou non existing.'})
    }
})


app.get('/collections', (req, res) => {
    try{
        const files = fs.readdirSync('./collections')
        const total_of_collections = files.length
        let collections = []
        for(let i = 0;  i < files.length; i++){
            const file = fs.readdirSync(`./collections/${files[i]}`)
            let items_collection = file.length
            let created_at = createdDate(`./collections/${files[i]}`)
            collections.push({collection: files[i], items_collection, created_at})
        }
        res.json({message: 'Success',  total_of_collections, collections})
    }catch(e){
        console.log(e)
        res.status(400).json({error: 'Collection not found ou non existing.'})
    }
})


app.get('/collections/:collection/items', (req, res) => {
    const collectionName = req.params.collection
    if(!fs.existsSync(`./collections/${collectionName}`)){
        res.status(400).json({error: 'Collection not found ou non existing.'})
        return //prevent from continuing
    }
    try{
        let files = fs.readdirSync(`./collections/${collectionName}`)
        let filesWithoutExtension = files.map((e) => { return e.replace('.json', '') })
        res.json({message: 'Success', howManyItems: files.length, items: filesWithoutExtension})
    }catch(e){
        console.log(e)
        res.status(400).json({error: 'Collection not found ou non existing.'})
    }
})

app.get('/collections/:collection/items/:key', (req, res) => {
    const collectionName = req.params.collection
    const key = req.params.key
    if(!fs.existsSync(`./collections/${collectionName}`)){
        res.status(400).json({error: 'Collection not found ou non existing.'})
        return //prevent from continuing
    }
    try{
        let file = fs.readFileSync(`./collections/${collectionName}/${key}.json`)
        res.json(JSON.parse(file))
    }catch(e){
        console.log(e)
        res.status(400).json({error: 'Collection not found ou non existing.'})
    }
})

app.delete('/collections/:collection/items/:key', (req, res) => {
    const collectionName = req.params.collection
    const key = req.params.key
    if(!fs.existsSync(`./collections/${collectionName}`)){
        res.status(400).json({error: 'Collection not found ou non existing.'})
        return //prevent from continuing
    }
    try{
        fs.unlinkSync(`./collections/${collectionName}/${key}.json`)
        res.json({message: 'Deleted with success.'})
    }catch(e){
        console.log(e)
        res.status(400).json({error: 'Error on delete.'})
    }
})

app.post('/collections/:collection/items', (req, res) => {
    const collectionName = req.params.collection
    const data = req.body.data
    const itemName = req.body.item
    if(!fs.existsSync(`./collections/${collectionName}`)){
        res.status(400).json({error: 'Collection not found ou non existing.'})
        return //prevent from continuing
    }
    if(fs.existsSync(`./collections/${collectionName}/${itemName}.json`)){
        res.status(400).json({error: 'Item exists can\'t override.'})
        return //prevent from continuing
    }
    try{
        fs.writeFileSync(`./collections/${collectionName}/${itemName}.json`, data)
        res.json({message: 'Sucess', item: itemName, data: JSON.parse(data)})
    }catch(e){
        console.log(e)
        res.status(400).json({error: 'Error on create item.'})
    }
})

app.put('/collections/:collection/items', (req, res) => {
    const collectionName = req.params.collection
    const data = req.body.data
    const itemName = req.body.item
    if(!fs.existsSync(`./collections/${collectionName}`)){
        res.status(400).json({error: 'Collection not found ou non existing.'})
        return //prevent from continuing
    }
    try{
        fs.writeFileSync(`./collections/${collectionName}/${itemName}.json`, data)
        res.json({message: 'Sucess', item: itemName, data: JSON.parse(data)})
    }catch(e){
        console.log(e)
        res.status(400).json({error: 'Error on create item.'})
    }
})

function createdDate (file) {  
    const { birthtime } = fs.statSync(file)
    return birthtime
}