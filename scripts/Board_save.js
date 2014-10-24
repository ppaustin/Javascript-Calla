
//    int [] shield;
//
//    int player_id;
//    int end_id;
//    int move_cnt;
//    String shistory;
//
//    boolean is_end;

var shield;
var player_id;
var end_id;
var move_cnt;
var shistory;
var is_end;

function cloneArray(a) {
    var b=[];
    for (var i= 0;i< a.length;i++) {
        b[i]=a[i];
    }
    return b;
}

function Board() {
    this.shield=cloneArray(shield);
    this.player_id=player_id;
    this.end_id=end_id;
    this.move_cnt=move_cnt;
    this.shistory=shistory;
    this.is_end=is_end;
    this.restore = function () {
        shield = cloneArray(this.shield);
        player_id = this.player_id;
        end_id = this.end_id;
        move_cnt = this.move_cnt;
        shistory = this.shistory;
        is_end = this.is_end;
        showBoard();
    };
}

var b_history=[];
var b_hist_id=-1;

function enable_prev_next() {
    $("#prevboard").prop("disabled",b_hist_id===0);
    $("#nextboard").prop("disabled",b_hist_id>=b_history.length-1);
}

function backup_board(_show) {
    var b=new Board();
    b_hist_id++;
    b_history[b_hist_id]=b;
    b_history.length=b_hist_id+1;
    if (_show)  {
        showBoard();
    }
    enable_prev_next();
}
function prev_board() {
    if (b_hist_id===0) return;
    b_hist_id--;
    b_history[b_hist_id].restore();
    enable_prev_next();
}
function next_board() {
    if (b_hist_id>=b_history.length-1) return;
    b_hist_id++;
    b_history[b_hist_id].restore();
    enable_prev_next();
}

//----------------
//initial reset
//----------------
reset();

function reset() {
    shield = [3, 3, 4, 3, 3, 0, 3, 3, 4, 3, 3, 0];
    player_id = 0;
    end_id = -1;
    move_cnt = 0;
    shistory = "A";
    is_end = false;
    
    b_history=[];
    b_hist_id=-1;
}

function score(p) {
    return shield[p === 0 ? 5 : 11];
}

function restart(p) {
    reset();
    player_id = p;
    shistory = (p === 0) ? "A" : "B";
    backup_board(true);
}

function canKeepMove() {
    if (move_cnt === 0)
        return true;
    return ((end_id === 5 && player_id === 0) || (end_id === 11 && player_id === 1));
}

function isEnd() {
    if (is_end)
        return is_end;
    var sa = score(0);
    var sb = score(1);
    if ((canKeepMove() && getMoveList().length === 0) || sa > 16 || sb > 16) {
        is_end = true;
    }
    return is_end;
}

//input: start_id=0-9
//output: end_id
//return true if move is ok.
function move(id) {
    if (isEnd())
        return false;
    var s_id = id;

    if (player_id === 0) {
        if (id < 0 || id > 4)
            return false;
    }
    else { //if (player===1)
        if (id < 5 || id > 9)
            return false;
        id++;
    }
    var cnt = shield[id];
    if (cnt === 0)
        return false;
    if (!canKeepMove())
        return false;

    shield[id] = 0;
    moveChip(cnt,id,0);
    for (id++; cnt > 0; cnt--, id++) {
        if ((id === 5 && player_id === 1) || (id === 11 && player_id === 0)) {
            //Wrong Gala
            id++;
        }
        id %= 12;
        end_id = id;
        shield[id]++;
        moveChip(cnt-1,id,400);
    }
    move_cnt++;
    shistory += s_id;
    backup_board(false);
    return true;
}

function canSteal() {
    var other_id = 10 - end_id;
    return canStealFrom(other_id);
}

function canSteal(other_id) {
    if (isEnd()) {
        return false;
    }
    if (move_cnt === 0 || end_id < 0 || (other_id + end_id !=10))
        return false;
    if (player_id === 0 && end_id >= 0 && end_id <= 4 && shield[end_id] === 1) {
        return (shield[other_id] > 0);
    }
    if (player_id === 1 && end_id >= 6 && end_id <= 10 && shield[end_id] === 1) {
        return (shield[other_id] > 0);
    }
    return false;
}

function steal() {
    var other_id = 10 - end_id;
    if (!canSteal(other_id))
        return false;

    var cnt=shield[other_id];
    shield[other_id] = 0;
    moveChip(cnt,other_id,0)

    var gala_id = (player_id === 0)? 5:11;
    shield[gala_id] += cnt;;
    moveChip(0,gala_id,400)

    move_cnt++;
    shistory += "S";
    backup_board(false);
    return true;
}

function switchPlayer()
{
    if (isEnd() || move_cnt === 0)
        return false;

    player_id = (player_id === 0) ? 1 : 0;
    end_id = -1;
    move_cnt = 0;
    if (!isEnd())
        shistory += "D";
    backup_board(false);
    return true;
}

function getMoveList() {
    var movelist = new Array();
    var id = 0;
    if (player_id === 1) id = 6;
    for (var i = 0; i < 5; i++, id++) {
        if (shield[id] > 0)
            movelist.push(id);
    }
    return movelist;
}

//input: start_id=0-4;6-10
function getMoveId(id) {
    if (6<=id && id<=10 ) {
        id--;
    }
    return id;
}

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
    button.value = (shield[i] == 0) ? "" : shield[i];
    if (end_id === i)
        button.value += "*";
}

function showValue() {
	var i;
	for (i = 0; i < shield.length; i++) {
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

function showBoard() {
	showValue();
	//disableButton();
    moveFlag(false);
}

function clickButton(bid) {
    var id=parseInt(bid.substr(1));
    var mvid=getMoveId(id);
	if ( move(mvid) || (canSteal(id) && steal()) ) {
		//showBoard();
    }
    //alert('You pressed '+id+' value='+v);
}

function createButtons() {
    var i, buttonContainer, newButton;
    buttonContainer = document.getElementById('my_board');
    //shields
    for (i = 0; i < shield.length; i++) {
        newButton = document.createElement('input');
        newButton.type = 'button';
        newButton.value = shield[i]==0?"":shield[i];
        newButton.id = "S"+i;
        newButton.onclick = function () {
            clickButton(this.id);
        };
        buttonContainer.appendChild(newButton);
    }
    //flag
    newButton = document.createElement('input');
    newButton.type = 'button';
    newButton.value = player_id==0?'S turn':"H turn";
    newButton.id = 'my_flag';
    newButton.onclick = function () {
        moveFlag(true);
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
    for (i=0; i<shield.length;i++) {
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
    style+='background-color:transparent;position:absolute;top:'+flag_y[player_id]+'px;left:'+flag_x+'px;';
    button.setAttribute('style', style);
}

function moveFlag(in_game) {
    var flag=$("#my_flag");
    if (!in_game || switchPlayer()) {
        flag.animate({
            left: flag_x + 'px',
            top: flag_y[player_id] + 'px'
        }, 400, "linear",function() {
            $(this).attr('value',player_id==0?"S turn":"H turn");
        });
        showValue();
    }
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
            reset();
            for (i=0;i<12;i++) {
                shield[i]=data[i];
            }
            if (data.length>=13)
                player_id=data[12];
            if (data.length>=14)
                end_id=data[13];
            if (data.length>=15)
                move_cnt=data[14];
            backup_board(true);
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
    backup_board(false);
};

window.onresize = function () {
    moveButtons();
};
