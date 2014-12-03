function cloneArray(a) {
    var b=[];
    for (var i= 0;i< a.length;i++) {
        b[i]=a[i];
    }
    return b;
}

function sign(v) {
    return (v>0? 1:(v<0? -1:0));
}

//--------------------------------
//    int [] shield;
//
//    int player_id;
//    int end_id;
//    int move_cnt;
//    String shistory;
//
//    boolean is_end;
//    EvaluateResult evaluate;

//--------------------------------
//Board class
function Board(other) {
    if (!other)
        this.reset();
    else
        this.copyFrom(other);
}

Board.prototype.reset = function () {
    this.shield = [3, 3, 4, 3, 3, 0, 3, 3, 4, 3, 3, 0];
    this.player_id = 0;
    this.end_id = -1;
    this.move_cnt = 0;
    this.shistory = "A";
    this.is_end = false;
    this.evaluate = null;
};

Board.prototype.copyFrom = function (other) {
    this.shield = cloneArray(other.shield);
    this.player_id = other.player_id;
    this.end_id = other.end_id;
    this.move_cnt = other.move_cnt;
    this.shistory = other.shistory;
    this.is_end = other.is_end;
    this.evaluate = other.evaluate;
};

//Board.prototype.backup = function () {
//    this.copyFrom(theBoard);
//};
//
Board.prototype.restore = function () {
    theBoard.copyFrom(this);
};

Board.prototype.score = function (p) {
    return this.shield[p === 0 ? 5 : 11];
};

Board.prototype.getMoveList = function () {
    var movelist = []; //new Array();
    var id = 0;
    if (this.player_id === 1) id = 6;
    for (var i = 0; i < 5; i++, id++) {
        if (this.shield[id] > 0)
            movelist.push(id);
    }
    return movelist;
};

//id=0-9
Board.prototype.move = function (id) {
    if (this.isEnd())
        return false;
    var s_id = id;

    if (this.player_id === 0) {
        if (id < 0 || id > 4)
            return false;
    }
    else { //if (this.player===1)
        if (id < 5 || id > 9)
            return false;
        id++;
    }
    var cnt = this.shield[id];
    if (cnt === 0)
        return false;
    if (!this.canKeepMove())
        return false;

    this.shield[id] = 0;
    for (id++; cnt > 0; cnt--, id++) {
        if ((id === 5 && this.player_id === 1) || (id === 11 && this.player_id === 0)) {
            //Wrong Gala
            id++;
        }
        id %= 12;
        this.end_id = id;
        this.shield[id]++;
    }
    this.move_cnt++;
    this.shistory += s_id;
    this.evaluate = null;
    return true;
};

//other_id = 0-4; 6-10
Board.prototype.canStealFrom = function(other_id) {
    if (this.isEnd()) {
        return false;
    }
    if (this.move_cnt === 0 || this.end_id < 0 || (other_id + this.end_id !=10))
        return false;
    if (this.player_id === 0 && this.end_id >= 0 && this.end_id <= 4 && this.shield[this.end_id] === 1) {
        return (this.shield[other_id] > 0);
    }
    if (this.player_id === 1 && this.end_id >= 6 && this.end_id <= 10 && this.shield[this.end_id] === 1) {
        return (this.shield[other_id] > 0);
    }
    return false;
};

//other_id = 0-4; 6-10
Board.prototype.stealFrom = function (other_id) {
    if (!this.canStealFrom(other_id))
        return false;
    var cnt=this.shield[other_id];
    this.shield[other_id] = 0;

    var gala_id = (this.player_id === 0)? 5:11;
    this.shield[gala_id] += cnt;

    this.move_cnt++;
    this.shistory += "S";
    this.evaluate = null;
    return true;
};

Board.prototype.steal = function () {
    var other_id = 10 - this.end_id;
    return this.stealFrom(other_id);
};

Board.prototype.canKeepMove = function () {
    if (this.move_cnt === 0)
        return true;
    return ((this.end_id === 5 && this.player_id === 0) || (this.end_id === 11 && this.player_id === 1));
};

Board.prototype.isEnd = function () {
    if (this.is_end)
        return this.is_end;
    var sa = this.score(0);
    var sb = this.score(1);
    if ((this.canKeepMove() && this.getMoveList().length === 0) || sa > 16 || sb > 16) {
        this.is_end = true;
    }
    return this.is_end;
};

Board.prototype.switchPlayer = function ()
{
    var e=this.isEnd();
    if (e || this.move_cnt === 0)
        return false;

    this.player_id = (this.player_id === 0) ? 1 : 0;
    this.end_id = -1;
    this.move_cnt = 0;
    if (!e)
        this.shistory += "D";
    return true;
};
//input: start_id=0-4;6-10
Board.prototype.internalMove = function(id) {
    if (this.player_id==1) {
        id--;
    }
    return this.move(id);
};

Board.prototype.getBoardList = function ( finished_only,  check_steal) {
//    var board_list=new Array();
//    var board_tmp=new Array();
    var board_list=[];
    var board_tmp=[];
    var move_list=this.getMoveList();
    var i,len;
    for (i=0,len=move_list.length;i<len;i++ ) {
        var b=new Board(this);
        if (!b.internalMove(move_list[i]))
            continue;
        if (!b.canKeepMove() || b.isEnd())
            board_list.push(b);
        else
            board_tmp.push(b);
    }
    for (i=0,len=board_tmp.length;i<len;i++ ) {
        var blist=board_tmp[i].getBoardList(finished_only, false);
        board_list=board_list.concat(blist);
    }

    if (!finished_only)
        board_list=board_list.concat(board_tmp);

    if (check_steal) {
        //var sl = new Array();
        for (i=0,len=board_list.length;i<len;i++ ) {
            var b1 = new Board(board_list[i]);
            if (b1.steal())
                board_list.push(b1);
        }
        //board_list.concat(sl);
        //board_list=sl;
    }

    return board_list;
};
//-----------------------------------------
// class EvaluateResult {
//    Board board;
//    private int status; //3:A win; 2:A score=16 1:tie 0:unkown -2:B score=16 -3:B win
//    int score_diff;
//    int score_A;
//    long run_time;

function EvaluateResult(b) {
//    EvaluateResult(Board b){
//        reset();
//        internalCheck(b);
//    }

    this.reset();
    this.internalCheck(b);
}

EvaluateResult.prototype.Check =function (b) {
    if (b.evaluate===null)
        b.evaluate=new EvaluateResult(b);
    return b.evaluate;
};

EvaluateResult.prototype.reset = function () {
//    void reset() {
//        board=come_from=null;
//        status=0;
//        score_diff=0;
//        score_A=0;
//    }
    this.board=null;
    this.status=0;
    this.score_diff=0;
    this.score_A=0;
};

//    void internalCheck(final Board b) {
//        CheckCount=CheckCount.add(BigInteger.ONE);
//
//        board=b;
//        score_A=board.score(Player.A);
//        int score_B=board.score(Player.B);
//        score_diff=score_A-score_B;
//        if (board.isEnd()) {
//            if (score_A>score_B) status = 3;
//            else if (score_A<score_B) status = -3;
//            else {
//                status=1;
//                //is_tie=true;
//            }
//        }
//        else {
//            if (score_A==16) status = 2;
//            else if (score_B==16) status = -2;
//        }
//    }
EvaluateResult.prototype.internalCheck = function (b) {
    this.board=b;
    this.score_A=b.score(0);
    var score_B=b.score(1);
    this.score_diff=this.score_A-score_B;
    if (b.isEnd()) {
        if (this.score_A>score_B) this.status = 3;
        else if (this.score_A<score_B) this.status = -3;
        else {
            this.status=1;
        }
    }
    else {
        if (this.score_A==16) this.status = 2;
        else if (score_B==16) this.status = -2;
    }
};

EvaluateResult.prototype.isAWin = function () { return status==3; };
EvaluateResult.prototype.isBWin = function () { return status==-3; };

//    int compareTo(int player_id,EvaluateResult rb) {
//        int result=compareAB(rb);
//        return (player_id==Player.A)? result:-result;
//    }
EvaluateResult.prototype.compareTo = function ( player_id, rb) {
    var result=this.compareAB(rb);
    return (player_id===0)? result:-result;
};

//    //compare player A vs player B
//    private int compareAB_sub1(EvaluateResult rb) {
//        //win more or loss less is better.
//        int s_diff=sign(score_diff-rb.score_diff);
//        if (s_diff != 0)
//            return s_diff;
//
//        //now win/loss are same
//        int sa_diff=sign(score_A-rb.score_A);
//        if (score_diff>0)     //A lead
//            return sa_diff;   //score_A the more the better
//        else if (score_diff<0)  //B lead,
//            return -sa_diff;    // score_B the less the better
//
//        //now it is tie
//        //return 0; //maybe enough!!
//        if (board.player_id==0) //next turn will be player B
//            return -sa_diff;    //score_B the less the better
//        return sa_diff;   //score_A the more the better
//    }

//compare player A vs player B
EvaluateResult.prototype.compareAB_sub1 = function (rb) {
    //win more or loss less is better.
    var s_diff=sign(this.score_diff-rb.score_diff);
    if (s_diff !== 0)
        return s_diff;

    //now win/loss are same
    var sa_diff=sign(this.score_A-rb.score_A);
    if (this.score_diff>0)     //A lead
        return sa_diff;   //score_A the more the better
    else if (this.score_diff<0)  //B lead,
        return -sa_diff;    // score_B the less the better

    //now it is tie
    //return 0; //maybe enough!!
    if (this.board.player_id===0) //next turn will be player B
        return -sa_diff;    //score_B the less the better
    return sa_diff;   //score_A the more the better
};

//private int compareAB(EvaluateResult rb) {
//    CompCount=CompCount.add(BigInteger.ONE);
//    if (status>rb.status)
//        return 1;
//    if (status<rb.status)
//        return -1;
//    return compareAB_sub1(rb);
//}

EvaluateResult.prototype.compareAB = function ( rb) {
    if (this.status>rb.status)
        return 1;
    if (this.status<rb.status)
        return -1;
    return this.compareAB_sub1(rb);
};

//-----------------------------------------
//init
var b_history=[];
var b_hist_id=-1;
var theBoard = new Board(null);
var pc_level=0;
var adj_level=1;
var theEvResult=new EvaluateResult(theBoard);


//-----------------------------------------
//move chips on board
//-----------------------------------------
function enable_prev_next() {
    $("#prevboard").prop("disabled",b_hist_id===0);
    $("#nextboard").prop("disabled",b_hist_id>=b_history.length-1);
}

function backup_board() {
    var b=new Board(theBoard);
    b_hist_id++;
    b_history[b_hist_id]=b;
    b_history.length=b_hist_id+1;
    enable_prev_next();
}

function prev_board() {
    if (b_hist_id===0) return;
    b_hist_id--;
    b_history[b_hist_id].restore();
    showBoard();
    enable_prev_next();
}

function next_board() {
    if (b_hist_id>=b_history.length-1) return;
    b_hist_id++;
    b_history[b_hist_id].restore();
    showBoard();
    enable_prev_next();
}

function switch_board() {
    if (!theBoard.switchPlayer()) {

        if (theBoard.shistory.length > 1)
		{
            return false;
		}
        var p = theBoard.player_id;
        p = (p === 0) ? 1 : 0;

        theBoard.reset();
        b_history = [];
        b_hist_id = -1;
        theBoard.player_id = p;
        theBoard.shistory = (p === 0) ? "A" : "B";
        adj_level = (p === 0) ? 1 : 0;
    }
    backup_board();
    showValue();
    moveFlag(true) ;
    return true;
}


//input: id=0-4 or 6-10
//output: end_id
//return true if move is ok.
function move_board(id, switch_player) {
    if (theBoard.isEnd())
        return false;
    var s_id = id;

    if (theBoard.player_id === 0) {
        if (id < 0 || id > 4)
            return false;
    }
    else { //if (player===1)
        if (id < 6 || id > 10)
            return false;
        s_id--;
    }
    var cnt = theBoard.shield[id];
    if (cnt === 0)
        return false;
    if (!theBoard.canKeepMove())
        return false;

    theBoard.shield[id] = 0;
    moveChip(cnt,id,0);
    theBoard.move_cnt++;
    var tid=id;
    for (id++; cnt > 0; cnt--, id++) {
        if ((id === 5 && theBoard.player_id === 1) || (id === 11 && theBoard.player_id === 0)) {
            //Wrong Gala
            id++;
        }
        id %= 12;
        tid=id;
        theBoard.end_id = id;
        theBoard.shield[id]++;
        moveChip(cnt-1,id,400,cnt===1);
    }
    theBoard.shistory += s_id;
    theBoard.evaluate = null;
    backup_board();
    if (switch_player) {
        moveChip(0,tid,0,true,true);
    }

    return true;
}

//function canSteal() {
//    var other_id = 10 - end_id;
//    return canStealFrom(other_id);
//}

function steal_board(other_id) {
    if (other_id===null)
        other_id = 10 - theBoard.end_id;
    if (!theBoard.canStealFrom(other_id))
        return false;

    var cnt=theBoard.shield[other_id];
    theBoard.shield[other_id] = 0;
    moveChip(cnt,other_id,0);

    var gala_id = (theBoard.player_id === 0)? 5:11;
    theBoard.shield[gala_id] += cnt;

    theBoard.move_cnt++;
    theBoard.shistory += "S";
    theBoard.evaluate = null;

    backup_board();

    moveChip(0,gala_id,400,true,true);
    return true;
}

////input: start_id=0-4;6-10
//function getMoveId(id) {
//    if (6<=id && id<=10 ) {
//        id--;
//    }
//    return id;
//}

//---------------------------
//UI related
var posi_x = [53,131,216,300,383,468,527];
var posi_y = [80,193,306];
var shield_x = [1,2,3,4,5,6,5,4,3,2,1,0];
var shield_y = [2,2,2,2,2,1,0,0,0,0,0,1];
var movebox_x=[];
var movebox_y=[];
var flag_x_base = 15;
var flag_y_base = [306,80];
var flag_x;
var flag_y=[];

function showShield(i) {
    var button = document.getElementById("S" + i);
    button.value = (theBoard.shield[i] === 0) ? "" : theBoard.shield[i];
    if (theBoard.end_id === i)
        button.value += "*";
}

function showValue() {
    var i;
    for (i = 0; i < theBoard.shield.length; i++) {
        showShield(i);
    }
}

//function disableButton() {
//	var i,button;
//	for (i=0;i<5;i++) {
//		button=document.getElementById("S"+i);
//		button.disabled=(isEnd() || player_id==1);
//		button=document.getElementById("S"+i+6);
//		button.disabled=(isEnd() || player_id==0);
//	}
//}

function moveFlag(auto_run) {
    var flag=$("#my_flag");
    flag.animate({
        left: flag_x + 'px',
        top: flag_y[theBoard.player_id] + 'px'
    }, 400, "linear",function() {
        $(this).attr('value',theBoard.player_id===0?"S turn":"H turn");
        if (auto_run) {
            if (!autoMove(theBoard)) {
                showValue();
            }
        }
    });
}

function showBoard() {
    showValue();
    //disableButton();
    moveFlag(false);
}

function clickButton(bid) {
    var id=parseInt(bid.substr(1));
    if ( move_board(id,false) || steal_board(id) ) {
        //showBoard();
    }
    //alert('You pressed '+id+' value='+v);
}

function createButtons() {
    var i, buttonContainer, newButton;
    buttonContainer = document.getElementById('my_board');
    //shields
    for (i = 0; i < theBoard.shield.length; i++) {
        newButton = document.createElement('input');
        newButton.type = 'button';
        newButton.value = theBoard.shield[i]===0?"":theBoard.shield[i];
        newButton.id = "S"+i;
        newButton.onclick = function () {
            clickButton(this.id);
        };
        buttonContainer.appendChild(newButton);
    }
    //flag
    newButton = document.createElement('input');
    newButton.type = 'button';
    newButton.value = theBoard.player_id===0?'S turn':"H turn";
    newButton.id = 'my_flag';
    newButton.onclick = function () {
        if (switch_board()) {
        }
    };
    buttonContainer.appendChild(newButton);
}

function moveButtons() {
    var w=600;
    var h=388; //image's size
    var ww=window.innerWidth;
    var wh=window.innerHeight;
    var x0=-17, y0=-30, factor=wh*0.95/h, i, x, y, bw, bh;
    bw = Math.round(60*factor);
    bh = Math.round(80*factor);
    var button,style;
    //shield
    for (i=0; i<theBoard.shield.length;i++) {
        x=Math.round((posi_x[shield_x[i]] + x0) * factor);
        y=Math.round((posi_y[shield_y[i]] + y0) * factor);
        button=document.getElementById("S"+i);
        if (i==5 || i==11) {
            style='font-size:55px;color:white;width:'+bh+'px;';
            button.disabled=true;
        }
        else
            style='font-size:50px;color:white;width:'+bw+'px;';
        style+='height:'+bh+'px;';
        style+='border-color:transparent;';
        style+='background-color:transparent;position:absolute;top:'+y+'px;left:'+x+'px;';
        button.setAttribute('style', style);
        movebox_x[i]=x;
        movebox_y[i]=y;
    }
    //adjust move_box location
    for (i=0;i<6;i++) {
        movebox_x[i] +=bw/2+4;
        movebox_y[i] +=bh*3/4;
        movebox_x[i+6] +=bw/2-4;
        movebox_y[i+6] +=-1;
    }

    //flag
    flag_x=Math.round(flag_x_base*factor);
    for (i=0; i<2;i++) {
        flag_y[i]=Math.round(flag_y_base[i]*factor);
    }
    button=document.getElementById('my_flag');
    style='font-size:35px;color:white;width:'+bh+'px;height:'+bw+'px;';
    style+='border-color:black;';
    style+='background-color:transparent;position:absolute;top:'+flag_y[theBoard.player_id]+'px;left:'+flag_x+'px;';
    button.setAttribute('style', style);
}


function isInteger(str) {
    var n=~~Number(str);
    return String(n) === str;
}

function readSingleFile(evt) {
    //var data=new Array();
    var data=[];
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0];

    if (f) {
        var r = new FileReader();
        r.onload = function(e) {
            var contents = e.target.result;

//            alert( "Got the file.n"
//                    +"name: " + f.name + "n"
//                    +"type: " + f.type + "n"
//                    +"size: " + f.size + " bytesn"
//                    + "starts with: " + contents.substr(1, contents.indexOf("n"))
//            );

            contents = contents.replace(/(\r\n|\n|\r)/gm," ");
            contents = contents.replace(/\s+/g," ");

            data.length=0;
            var clist=contents.split(" ");
            var i;
            for (i=0;i<clist.length;i++) {
                if (isInteger(clist[i]))
                    data.push(parseInt(clist[i]));
            }
            if (data.length<12) {
                alert("Unknown format!")
                return;
            }
            theBoard.reset();
            for (i=0;i<12;i++) {
                theBoard.shield[i]=data[i];
            }
            if (data.length>=13)
                theBoard.player_id=data[12];
            if (data.length>=14)
                theBoard.end_id=data[13];
            if (data.length>=15)
                theBoard.move_cnt=data[14];
            backup_board();
            showBoard();
        }
        r.readAsText(f);
    } else {
        alert("Failed to load file");
    }
}

//function sleep(milliseconds) {
//    var start = new Date().getTime();
//    for (var i = 0; i < 1e7; i++) {
//        if ((new Date().getTime() - start) > milliseconds){
//            break;
//        }
//    }
//}

/* function moveChip_2(num,id,speed,switch_player) {
//speed=0;
    var chip=$("#my_chip");
    //var flag=$("#my_flag");
    //flag.prop("disabled",true);
    chip.animate({
        left: movebox_x[id] + 'px',
        top: movebox_y[id] + 'px'
    }, speed, "linear",function() {
        $(this).text(num.toString());
        showShield(id);
    });
    chip.animate({
        left: movebox_x[id] + 'px',
        top: movebox_y[id] + 'px'
    }, speed, "linear",function() {
        $(this).text(num===0?'':num.toString());
        //flag.prop("disabled",false);
        if(switch_player) {
            switch_board()
        }

    });
}
 */
 
function moveChip(num,id,speed,last_move,switch_player) {
//speed=0;
	last_move = typeof last_move !== 'undefined'? last_move:false;
	switch_player =  typeof switch_player !== 'undefined'? switch_player:false;
    var chip=$("#my_chip");
    var button = document.getElementById("S" + id);
    var b_val= (theBoard.shield[id] === 0) ? "" : theBoard.shield[id];
    if (last_move)
        b_val += "*";
    //var flag=$("#my_flag");
    //flag.prop("disabled",true);
    chip.animate({
        left: movebox_x[id] + 'px',
        top: movebox_y[id] + 'px'
    }, speed, "linear",function() {
        $(this).text(num.toString());
        button.value = b_val;
    });
    chip.animate({
        left: movebox_x[id] + 'px',
        top: movebox_y[id] + 'px'
    }, speed, "linear",function() {
        $(this).text(num===0?'':num.toString());
        //flag.prop("disabled",false);
        if (last_move) {
			if (theBoard.isEnd()) {
				var rc=sign(theBoard.score(0)-theBoard.score(1));
				var flag=$("#my_flag");
				flag.attr('value',rc>0?"S Win!":(rc<0?"H Win!":"Tie"));
			}
			else if (switch_player) {
				switch_board()
			}
        }

    });
}

//--------------------------------------------
//for given board, return the best move for player_id,
// level is the max search level
function searchMove(board, level)
{
    var startTime = Date.now();
    var result= searchResursive(board,level);
    var endTime = Date.now();
    result.run_time=endTime - startTime;
    return result;
}

function searchResursive( board,  level)
{
    var result=null;

    if (board.isEnd())
    {
        result = theEvResult.Check(board);
        //result.come_from = board;
        return result;
    }
    var finished_only=false;
    var check_steal=true;

    //get possible move
    var moveList = board.getBoardList(finished_only,check_steal);
    var n = moveList.length;
    if (n === 0)
    {
        alert("DBG unfinished board!");
        board.is_end = true;
        result = theEvResult.Check(board);
        //result.come_from = board;
        return result;
    }

    //check if already win
    var i;
    for ( i=0;i<n;i++)
    {
        result = theEvResult.Check(moveList[i]);
        if (board.player_id === 0)
        {
            if (!result.isAWin())
                continue;
        } else if (!result.isBWin())
            continue;
        //result.come_from = board;
        return result;
    }


    //search best move
    var er_tmp;
    for (i = 0; i < n; i++)
    {
        //get expectation board
        var b_exp = moveList[i];
        if (level > 1)
        {
            var b_exp2 = new Board(b_exp);
            b_exp2.switchPlayer();
            er_tmp = searchResursive(b_exp2, level - 1);
        }
        else
        {
            er_tmp = theEvResult.Check(b_exp);
        }
//        var tt1=er_tmp.board.shistory;
//        var tt2=result.board.shistory;
//        if (er_tmp.board.shistory=="B8D2D7") {
//            var t="found 1!";
//        }
//        if (er_tmp.board.shistory=="B9D0D7") {
//            var t="found 2!";
//        }
        //er_tmp.come_from=moveList[i];
        if (i === 0 || (result.compareTo(board.player_id, er_tmp) < 0))
        {
            result = er_tmp;
            var t1=er_tmp.board.shistory;
            var t2=result.board.shistory;
        }
    }
    return result;
}

function autoMove(board)
{
    if (board.isEnd() || board.player_id!=1)
        return false;
    if (pc_level===0)
        return false;
    var result=searchMove(board,pc_level+adj_level);
    if (board==result.board)
        return false;
    var next_board;
//    if (board==result.come_from)
//        next_board = result.board;
//    else
//        next_board = result.come_from;
    next_board = result.board;
    var s1=next_board.shistory;
    var s0=board.shistory;
    var steps=s1.substr(s0.length);
    var pos_d=steps.indexOf("D");
    if (pos_d>0)
        steps=steps.substr(0,pos_d);
    //alert("runtime="+result.run_time+" steps="+steps);
    for (var i= 0, len=steps.length; i<len;i++) {
        switch(steps[i]) {
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
                move_board(parseInt(steps[i])+1,i==len-1);
                break;
            case "S":
                steal_board(null);
                break;
            default:
                alert("Unknown step"+steps[i]);
                return false;
        }
    }
    return true;
}

function auto_go() {
    var lev=$("#opponent").prop("selectedIndex");
    pc_level=lev;
    if (pc_level>0) {
        $("#prevboard").hide();
        $("#nextboard").hide();
        $("#fileinput").hide();
    }
    else {
        $("#prevboard").show();
        $("#nextboard").show();
        $("#fileinput").show();
    }
    autoMove(theBoard);
}

//--------------------------------------------

window.onload = function () {
    var finput=document.getElementById('fileinput');
    finput.addEventListener('change', readSingleFile, false);
    createButtons();
    moveButtons();
    moveChip(0,0,0);
    backup_board();
};

window.onresize = function () {
    moveButtons();
};

//notes:
/*
1 for in loop behavior is wired
2 why need moveChip in onload to enalbe buttons?
changes
 searchResursive (>-1 => >-2)
 EvaluateResult needs change: sign ...

*/