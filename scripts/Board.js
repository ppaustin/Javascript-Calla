function cloneArray(a) {
    var b=[];
    for (var i= 0;i< a.length;i++) {
        b[i]=a[i];
    }
    return b;
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

//--------------------------------

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
};

Board.prototype.copyFrom = function (other) {
    if (this===other)
        return;
    this.shield=cloneArray(other.shield);
    this.player_id=other.player_id;
    this.end_id=other.end_id;
    this.move_cnt=other.move_cnt;
    this.shistory=other.shistory;
    this.is_end=other.is_end;
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
    var movelist = new Array();
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
    return true;
};

Board.prototype.steal = function () {
    var other_id = 10 - this.end_id;
    return canStealFrom(other_id);
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

//    this.getBoardList1 = function ( finished_only) {
//        return this.getBoardList2(finished_only, true);
//    };

Board.prototype.getBoardList2 = function ( finished_only,  check_steal) {
    var board_list=new Array();
    var board_tmp=new Array();
    var move_list=getMoveList();
    var i,b;
    for (i in move_list ) {
        b=new Board();
        if (!b.internalMove(i))
            continue;
        if (!b.canKeepMove() || b.isEnd())
            board_list.push(b);
        else
            board_tmp.push(b);
    }
    for (b in board_tmp) {
        var blist=b.getBoardList2(finished_only, false);
        board_list.concat(blist);
    }

    if (!finished_only)
        board_list.concat(board_tmp);

    if (check_steal) {
        var sl = new Array();
        for (b in board_list) {
            var b1 = new Board();
            b1.copyFrom(b);
            if (b1.steal())
                sl.push(b1);
        }
        board_list.concat(sl);
        //board_list=sl;
    }

    return board_list;
};


//-----------------------------------------
//init
var b_history=[];
var b_hist_id=-1;
var theBoard = new Board(null);
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
    if (theBoard.switchPlayer()) {
        return true;
    }
    if (theBoard.shistory.length>1)
        return false;
    var p=theBoard.player_id;
    p= (p===0)? 1:0;

    theBoard.reset();
    b_history=[];
    b_hist_id=-1;
    theBoard.player_id = p;
    theBoard.shistory = (p === 0) ? "A" : "B";
    return true;
}


//input: id=0-4 or 6-10
//output: end_id
//return true if move is ok.
function move_board(id) {
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
    for (id++; cnt > 0; cnt--, id++) {
        if ((id === 5 && theBoard.player_id === 1) || (id === 11 && theBoard.player_id === 0)) {
            //Wrong Gala
            id++;
        }
        id %= 12;
        theBoard.end_id = id;
        theBoard.shield[id]++;
        moveChip(cnt-1,id,400);
    }
    theBoard.move_cnt++;
    theBoard.shistory += s_id;
    backup_board();
    return true;
}

//function canSteal() {
//    var other_id = 10 - end_id;
//    return canStealFrom(other_id);
//}

function steal_board(other_id) {
    if (!theBoard.canStealFrom(other_id))
        return false;

    var cnt=theBoard.shield[other_id];
    theBoard.shield[other_id] = 0;
    moveChip(cnt,other_id,0);

    var gala_id = (theBoard.player_id === 0)? 5:11;
    theBoard.shield[gala_id] += cnt;
    moveChip(0,gala_id,400);

    theBoard.move_cnt++;
    theBoard.shistory += "S";
    backup_board();
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
var flag_y=new Array();

function showShield(i) {
    var button = document.getElementById("S" + i);
    button.value = (theBoard.shield[i] == 0) ? "" : theBoard.shield[i];
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

function moveFlag() {
    var flag=$("#my_flag");
    flag.animate({
        left: flag_x + 'px',
        top: flag_y[theBoard.player_id] + 'px'
    }, 400, "linear",function() {
        $(this).attr('value',theBoard.player_id==0?"S turn":"H turn");
    });
}

function showBoard() {
    showValue();
    //disableButton();
    moveFlag();
}

function clickButton(bid) {
    var id=parseInt(bid.substr(1));
    if ( move_board(id) || steal_board(id) ) {
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
        newButton.value = theBoard.shield[i]==0?"":theBoard.shield[i];
        newButton.id = "S"+i;
        newButton.onclick = function () {
            clickButton(this.id);
        };
        buttonContainer.appendChild(newButton);
    }
    //flag
    newButton = document.createElement('input');
    newButton.type = 'button';
    newButton.value = theBoard.player_id==0?'S turn':"H turn";
    newButton.id = 'my_flag';
    newButton.onclick = function () {
        if (switch_board()) {
            backup_board();
            moveFlag() ;
        }
    };
    buttonContainer.appendChild(newButton);
}

function moveButtons() {
    var w=600;
    var h=388; //image's size
    var ww=window.innerWidth;
    var wh=window.innerHeight;
    var x0=-17, y0=-30, factor=wh*.95/h, i, x, y, bw, bh;
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
    var data=new Array();
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

function moveChip(num,id,speed) {
    var chip=$("#my_chip");
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
        $(this).text(num==0?'':num.toString());
    });
}


window.onload = function () {
    var finput=document.getElementById('fileinput');
    finput.addEventListener('change', readSingleFile, false);
    createButtons();
    moveButtons();
    backup_board();
};

window.onresize = function () {
    moveButtons();
};
