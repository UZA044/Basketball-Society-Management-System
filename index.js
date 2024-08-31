const express = require('express');
const ejs = require('ejs');
const mysql = require('mysql2');
const util = require('util');
const bodyParser = require('body-parser');

const PORT = 8000;
const DB_HOST = 'hosting-basketballmanagementsystem.h.aivencloud.com';
const DB_USER = 'avnadmin';
const DB_PASSWORD = 'AVNS_QAl2mRq8U-sRk3w4M8a';
const DB_NAME = 'coursework';
const DB_PORT =24168;

var connection = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT
});

connection.query = util.promisify(connection.query).bind(connection);
connection.connect((err) => {
	if (err) {
		console.error(`Could not connect to coursework database
		    ${err}
		`);
		return;
	}


	console.log('YES, you are connected');
});

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', async (req,res) =>{
    const playerCount = await connection.query('SELECT COUNT(*) as count FROM Basketball_Membership');
    const AvgPlayerWeight = await connection.query('SELECT AVG(Weight) as Average_Weight FROM Basketball_Membership');
    const AvgPlayerHeight = await connection.query('SELECT AVG(Height) as Average_Height FROM Basketball_Membership');
    const CommitteCount = await connection.query('SELECT COUNT(*) as Committee_Count FROM Committee_Members');


res.render('index.ejs',{
    playerCount: playerCount[0].count,
    AvgPlayerWeight: AvgPlayerWeight[0].Average_Weight,
    AvgPlayerHeight: AvgPlayerHeight[0].Average_Height,
    CommitteCount: CommitteCount[0].Committee_Count,


});


});
app.get('/players', async (req,res) =>{
    const Players = await connection.query('SELECT S.Stu_FName, S.Stu_LName, M.Membership_ID, M.Position, M.Height, M.Weight, M.Membership_Type FROM Basketball_Membership M JOIN Student S ON M.URN = S.URN ;')

    res.render('players', {Players: Players});
});

app.get('/players/view/:id', async (req,res) =>{
    const Player = await connection.query('SELECT S.Stu_FName, S.Stu_LName, M.Membership_ID, M.Position, M.Height, M.Weight, M.Membership_Type FROM Basketball_Membership M JOIN Student S ON M.URN = S.URN WHERE M.Membership_ID = ?', [req.params.id]);
    

    res.render('view_player', {Player: Player});
});
app.get('/players/edit/:id', async (req,res) =>{
    const Player = await connection.query('SELECT S.Stu_FName, S.Stu_LName, M.Membership_ID, M.Position, M.Height, M.Weight, M.Membership_Type FROM Basketball_Membership M JOIN Student S ON M.URN = S.URN WHERE M.Membership_ID = ?', [req.params.id]);

    const PositionValues=['C','PF','CF','PG','SG'];
    res.render('edit_player', {Player: Player, PositionValues: PositionValues , message: ''});



});
app.get('/players/create', async (req,res) =>{

    const PositionValues=['C','PF','CF','PG','SG'];
    const MembershipTypes=['Men First', 'Men Second','Women First', 'Women','Men'];

    res.render('create_player', {PositionValues: PositionValues,MembershipTypes: MembershipTypes, message: '' });

});

app.post('/players/create', async (req,res) =>{
    const NewDetails = req.body;
    const PlayerCount= await connection.query('SELECT COUNT(*) as count FROM Basketball_Membership');



    if (isNaN(NewDetails.Weight)|| isNaN(NewDetails.Height)){
        const PlayerCount= await connection.query('SELECT COUNT(*) as count FROM Basketball_Membership');

        const PositionValues=['C','PF','CF','PG','SG'];
        const MembershipTypes=['Men First', 'Men Second','Women First', 'Women','Men'];

        res.render('create_player', {PlayerCount: PlayerCount,PositionValues: PositionValues,MembershipTypes: MembershipTypes, message: 'Please enter valid values!' });
        return;};

    try {
        await connection.query('INSERT INTO Basketball_Membership (Membership_ID,URN,Bask_Soc_ID,Position,Height,Weight,Membership_Type) VALUES (?,?,?,?,?,?,?)', [PlayerCount[0].count+1,NewDetails.URN,1,NewDetails.Position,NewDetails.Height,NewDetails.Weight,NewDetails.Memb_Type]);

        const PositionValues=['C','PF','CF','PG','SG'];
        const MembershipTypes=['Men First', 'Men Second','Women First', 'Women','Men'];

        res.render('create_player', {PositionValues: PositionValues,MembershipTypes: MembershipTypes, message: 'New Player details added!!' });
    } catch (error) {
        const PlayerCount= await connection.query('SELECT COUNT(*) as count FROM Basketball_Membership');

        const PositionValues=['C','PF','CF','PG','SG'];
        const MembershipTypes=['Men First', 'Men Second','Women First', 'Women','Men'];

        res.render('create_player', {PlayerCount: PlayerCount,PositionValues: PositionValues,MembershipTypes: MembershipTypes, message: 'Please enter a valid URN!' });
        
    }
    
});

app.post('/players/edit/:id',async (req,res) =>{
    const UpdatedDetails = req.body;

    if (isNaN(UpdatedDetails.Weight)|| isNaN(UpdatedDetails.Height)){
        const Player = await connection.query('SELECT S.Stu_FName, S.Stu_LName, M.Membership_ID, M.Position, M.Height, M.Weight, M.Membership_Type FROM basketball_membership M JOIN Student S ON M.URN = S.URN WHERE M.Membership_ID = ?', [req.params.id]);

        const PositionValues=['C','PF','CF','PG','SG'];
        res.render('edit_player', {Player: Player, PositionValues: PositionValues , message: 'THE WEIGHT OR HEIGHT VALUES WERE NOT A NUMBER PLEASE TRY AGAIN'});
        return;
    };
    await connection.query('UPDATE Basketball_Membership SET ? WHERE Membership_ID = ?', [UpdatedDetails,req.params.id]);

    const Player = await connection.query('SELECT S.Stu_FName, S.Stu_LName, M.Membership_ID, M.Position, M.Height, M.Weight, M.Membership_Type FROM Basketball_Membership M JOIN Student S ON M.URN = S.URN WHERE M.Membership_ID = ?', [req.params.id]);

    const PositionValues=['C','PF','CF','PG','SG'];
    res.render('edit_player', {Player: Player, PositionValues: PositionValues , message: 'Player has been updated'});
});


app.listen(PORT, () => {
	console.log(`
    application listening on http://localhost:${PORT}`);
});