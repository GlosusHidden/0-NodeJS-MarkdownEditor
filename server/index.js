const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID

const urlencodedParser = bodyParser.urlencoded({extended: false})

const fs = require("fs")

const publicPath = path.join(__dirname, '../public')



const app = express()

app.set('view engine', 'ejs')

const port = process.env.PORT || 3000

app.use(express.static(publicPath))

function readFile(fileName) {
    let file_read
    try {
        file_read = fs.readFileSync(publicPath + '/documents/' + fileName, 'utf8')
    }catch (err) {
        console.log(err)
    }
    return file_read
}

function writeFile(fileName){
    fs.writeFileSync(publicPath+'/public/documents/'+fileName+'.md', "")
}

//Connection
const url = 'mongodb://localhost:27017/'
const mongoClient = new MongoClient(url, { useNewUrlParser: true })
let db
let collection
mongoClient.connect(function (err, client){
    if (err){
        return console.log(err)
    }
    db = client.db('MarkdownEditor')
    collection = db.collection("myFiles")

    app.listen(port, () => {
        console.log('Server started on port ' + port)
    })
})

app.post("/add", urlencodedParser, function (req, res) {
    if(!req.body) return res.sendStatus(400)
    let file = { fileName : req.body.newDoc }
    collection.countDocuments({ fileName : req.body.newDoc }, function (err, num) {
        if (num === 0){
            collection.insertOne(file, function (err, res) {
                if (err){
                    console.log(err)
                    return res.sendStatus(500)
                }
            })
            let fileStringName = 'public/documents/' + file.fileName + '.md'
            fs.writeFileSync(fileStringName, "")
            collection.findOne({ fileName : req.body.newDoc }, function(err, doc){
                res.redirect('/document/'+doc._id)
            });
        }else{
            res.redirect("error")
        }
    })
})

app.post("/update", urlencodedParser, function (req, res) {
    if(!req.body) return res.sendStatus(400)
    let fileId = req.body.id
    let fileName = req.body.name
    let fileText = req.body.fileText
    let fileStringName = 'public/documents/' + fileName + '.md'
    fs.writeFileSync(fileStringName, fileText)
    res.redirect('/document/'+fileId)
})

app.post("/delete", urlencodedParser, function (req, res) {
    if(!req.body) return res.sendStatus(400)
    let fileId = req.body.id
    let fileName = req.body.name
    let fileStringName = 'public/documents/' + fileName + '.md'
    fs.unlink(fileStringName, function(err){
        if (err) { console.log(err) }
    })
    collection.deleteOne({ _id : new ObjectID(fileId) }, function(err, doc){});
    res.redirect('/document/')
})



app.get('/error', function (req, res) {
    res.render('error')
})

app.get('/document', function (req, res) {
    collection.find({}).toArray(function(err, result) {
        if (err) throw err;
        allFiles = result;
        res.render('index', { 'Id' : -1, 'Text' : '', 'FileName' : 'None' , 'allFiles' : allFiles })
    })
})

app.get('/document/:id', function (req, res) {
    var documentId = req.params.id;
    collection.findOne({ _id : new ObjectID(documentId) }, function(err, doc){
        if (err){
            console.log(err)
            return res.sendStatus(500)
        }
        let allFiles
        collection.find({}).toArray(function(err, result) {
            if (err) throw err;
            allFiles = result;
            let text = readFile((doc.fileName + '.md'))
            res.render('index', { 'Id' : documentId, 'Text' : text, 'FileName' : doc.fileName, 'allFiles' : allFiles })
        })

    })
})


