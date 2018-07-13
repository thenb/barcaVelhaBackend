var app  = require('express')()
var bodyParser  = require('body-parser');
var cors = require('cors');
var busboy = require('connect-busboy');
var mysql = require('mysql');

//bodyparser needs
app.use(bodyParser.urlencoded({
  extended: true
}));

//bodyParse/Cors/Busboy
app.use(bodyParser.json({ extended: true }));
app.use(cors());
app.use(busboy()); 

//database
var pool  = mysql.createPool({
	connectionLimit : 20,
	host     : 'g8mh6ge01lu2z3n1.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
	port : '3306',
	user     : 'ghy6trmydb22z0e2',
	password : 'ife8u8clqe0rjd74',
	database: 'ay7h56yxux99uzop'
  });

app.use(function(err, req, res, next) {
  next(err);
});

//Inicio das Rotas
//getId: Retorna o Id da token de instalacao
app.post('/getId', function(req, res) {
	pool.getConnection(function(err, connection) {		
		var string = 'select * from usuario where token = "'+req.body.token+'"';
		console.log(string);
		connection.query(string , function(err, data) {
			if (err){
				var error = {};
				error.type = 1;
				error.msg = err;
				connection.release();
				return res.jsonp(error);
			}
			//adiciona o id novo se ja nao existir
			if (data === 'undefined'|| data.length == 0){				
				var string1 = 'insert into usuario(token) values("'+req.body.token+'")';
				console.log(string);
				connection.query(string1 , function(err, data1) {
					if (err){
						var error = {};
						error.type = 1;
						error.msg = err;
						connection.release();
						return res.jsonp(error);
					}
					console.log(data1)
					connection.release();
					return res.json(data1);
					//return res.jsonp(data1.token);
				});
			//ja existe, retorna o usuario completo
			}else{
				console.log(data)
				connection.release();
				return res.json(data);
			}			
		});
	});	
});

//getAllMsgs: Busca todas as mensagens
app.post('/getAllMsgs', function(req, res) {	
	pool.getConnection(function(err, connection) {	
		var string = 'SELECT s.* FROM (SELECT * FROM mensagem LEFT JOIN mensagem_x_usuario  ON mensagem.id = mensagem_x_usuario.id_mensagem where mensagem_x_usuario.id_mensagem is null or mensagem_x_usuario.id_usuario = '+req.body.id_usuario+' UNION SELECT * FROM mensagem RIGHT JOIN mensagem_x_usuario ON mensagem.id = mensagem_x_usuario.id_mensagem where mensagem_x_usuario.id_mensagem is null or mensagem_x_usuario.id_usuario = '+req.body.id_usuario+') s LIMIT 0,15';		
		console.log(string);
		connection.query(string, function(err, data) {
			if (err){
				var error = {};
				error.type = 1;
				error.msg = err;
				connection.release();
				return res.jsonp(error);
			}	
			connection.release();
			return res.jsonp(data);
		});
	});
});

//getAllEnquetes: Busca todas as enquetes
app.post('/getAllEnquetes', function(req, res) {	
	pool.getConnection(function(err, connection) {	
		var string = 'SELECT s.* FROM (SELECT * FROM enquete LEFT JOIN enquete_x_usuario  ON enquete.id = enquete_x_usuario.id_enquete where enquete_x_usuario.id_enquete is null or enquete_x_usuario.id_usuario = '+req.body.id_usuario+' UNION SELECT * FROM enquete RIGHT JOIN enquete_x_usuario ON enquete.id = enquete_x_usuario.id_enquete where enquete_x_usuario.id_enquete is null or enquete_x_usuario.id_usuario = '+req.body.id_usuario+' ) s ORDER BY s.respondido asc';
		console.log(string);
		connection.query(string, function(err, data) {
			if (err){
				var error = {};
				error.type = 1;
				error.msg = err;
				connection.release();
				return res.jsonp(error);
			}	
			connection.release();
			return res.jsonp(data);
		});
	});
});

//readMsg: Atualiza a mensagem como lida
app.post('/curtirMsg', function(req, res) {
	pool.getConnection(function(err, connection) {
		var string = 'select * from mensagem_x_usuario where id_usuario ='+req.body.id_usuario+' and id_mensagem = '+req.body.id_mensagem;
		console.log(string);
		connection.query(string , function(err, data) {
			if(data.length==0){
				var string = 'insert into mensagem_x_usuario(id_usuario, id_mensagem, curtido) values('+req.body.id_usuario+','+req.body.id_mensagem+','+req.body.curtido+')';
				console.log(string);
				connection.query(string , function(err, data1) {
				if (err){
						var error = {};
						error.type = 1;
						error.msg = err;
						connection.release();
						return res.jsonp(error);
					}
					connection.release();
					return res.jsonp("Mensagem_x_usuario Criada com sucesso");
				});
			}else{
				var string = 'update mensagem_x_usuario set curtido ='+req.body.curtido+' where id_mensagem = '+req.body.id_mensagem+' and id_usuario = '+req.body.id_usuario;
				console.log(string);
				connection.query(string , function(err, data1) {
				if (err){
						var error = {};
						error.type = 1;
						error.msg = err;
						connection.release();
						return res.jsonp(error);
					}
					connection.release();
					return res.jsonp("Mensagem_x_usuario Criada com sucesso");
				});
			}			
		});	
	});	
});

//replayPoll: Atualiza a enquete com a resposta
app.post('/replayPoll', function(req, res) {
	pool.getConnection(function(err, connection) {
		var string = 'insert into enquete_x_usuario(id_usuario, id_enquete, resposta, respondido) values('+req.body.id_usuario+','+req.body.id_enquete+','+req.body.resposta+',true)';
		console.log(string);
		connection.query(string , function(err, data) {
		if (err){
				var error = {};
				error.type = 1;
				error.msg = err;
				connection.release();
				return res.jsonp(error);
			}
			connection.release();
			return res.jsonp("Enquete Respondida com sucesso");
		});
	});	
});

//newPoll: Cria Nova Enquete
app.post('/newPoll', function(req, res) {
	pool.getConnection(function(err, connection) {
		if(req.body.opcao_1==""){
			req.body.opcao_1 = null;
		}
		if(req.body.opcao_2==""){
			req.body.opcao_2 = null;
		}
		if(req.body.opcao_3==""){
			req.body.opcao_3 = null;
		}
		if(req.body.opcao_4==""){
			req.body.opcao_4 = null;
		}
		
		var string = 'insert into enquete(descricao,data_criacao,data_fim,opcao_1,opcao_2,opcao_3,opcao_4) values("'+req.body.descricao+'",now(),"'+req.body.data_fim+'","'+req.body.opcao_1+'","'+req.body.opcao_2+'","'+req.body.opcao_3+'","'+req.body.opcao_4+'")';
		console.log(string);
		connection.query(string , function(err, data) {
		if (err){
				var error = {};
				error.type = 1;
				error.msg = err;
				connection.release();
				return res.jsonp(error);
			}
			connection.release();
			return res.jsonp("Enquete Criada com sucesso");
		});
	});	
});

//newMsg: Cria Nova Mensagem
app.post('/newMsg', function(req, res) {
	pool.getConnection(function(err, connection) {
		if(typeof req.body.on_fire == 'undefined'){
			req.body.on_fire = false;
		}
		
		
		
		var string = 'insert into mensagem(descricao,data_criacao,data_evento,on_fire) values("'+req.body.descricao+'",now(),"'+req.body.data_evento+'",'+req.body.on_fire+')';
		console.log(string);		
		connection.query(string , function(err, data) {
		if (err){
				var error = {};
				error.type = 1;
				error.msg = err;
				connection.release();
				return res.jsonp(error);
			}
			connection.release();
			return res.jsonp("Mensagem Criada com sucesso");
		});
	});	
});



//configuracao para o heroku
app.listen(process.env.PORT || 5000)

console.log('Listening');