const express = require('express')
const router = express.Router()
const mysql = require('mysql')
const fs = require('fs')
// pytorch model import
const pytorch_model = require('../run_pytorch')

var db = mysql.createConnection({
	host : 'localhost',
	user : 'root',
	password : process.env.db_password,
	database : 'node_db'
})

db.connect();

router.get('/main',(req,res)=>{
	// pytorch model child process testing
	pytorch_model('sample_upload') // sample 이미지 명
	req.session.name = 'main'
	res.send({status:200,session:req.session})
})

router.post('/upload',async (req,res)=>{
	console.log('img input router activated')
    console.log(req.session)
	const uploaded_img_binary = req.body.img_binary

	const decoded_img = Buffer.from(uploaded_img_binary,'base64')
	
	const img_id = 'decoded' + Date.now()

	req.session.input = img_id

	await fs.writeFile(`org_images/${img_id}.jpg`, decoded_img ,(err)=>{
		if (err){
			throw err
		} else {
			console.log('original img save success')
		}	
	});
		// db.query('INSERT INTO user_upload_t ()',(err,result)=>{
	// 	if (err){
	// 		throw err
	// 	}
	// 	else {
	// 		console.log(result + 'from /img/upload')
	// 	}
	// })

	res.json({status:200,session:req.session})
	
})

router.get('/output', async (req,res)=>{

	// db.query('INSERT INTO user_upload_t ()',(err,result)=>{
	// 	if (err){
	// 		throw err
	// 	}
	// 	else {
	// 		console.log(result + 'from /img/upload')
	// 	}
	// })

	console.log('img output router activated')
	console.log(req.session)
	console.log('session input:' , req.session.input)

	await pytorch_model(req.session.input).then((prc_id) =>{
		console.log(prc_id)
		const processed_img = fs.readFileSync(`prc_images/${prc_id}.jpg`)
		const processed_img_encoded = Buffer.from(processed_img).toString('base64')
		res.json({status:200,output:processed_img_encoded})
	}).catch((err)=>{
		console.error(err)
		res.json({status:404})
	})

	// 이 방법도 되지만 Error handling 위해 Promise를 활용
	// await pytorch_model(req.session.input)

})

module.exports = router