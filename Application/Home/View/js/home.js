/// <reference path="jquery-1.8.2.min.js" />

$(function () {
    game.initialize();
});

/*游戏对象*/
var game = {
    maxTimeStr: '00:10:00',
    $cWrapper: null,
    $gWrapper: null,
    $gOverWrapper: null,
    timeInterval: null,
    questionsArr: [{ qId: 1, qDescription: '在ps中，ctrl+c是复制的快捷键对么？', answer: true }, { qId: 2, qDescription: '在ps中，ctrl+v是复制的快捷键对么？', answer: false },
        { qId: 3, qDescription: '在ps中，ctrl+j是复制图层的快捷键对么？', answer: true }, { qId: 4, qDescription: '在ps中，ctrl+b是取消选区的快捷键对么？', answer: false },
        { qId: 5, qDescription: '在ps中，p是快速蒙板的快捷键对么？', answer: true }, { qId: 6, qDescription: '在ps中，ctrl+i是反向选择的快捷键对么？', answer: true },
        { qId: 7, qDescription: '在ps中，ctrl+t是标尺的快捷键对么？', answer: false }, { qId: 8, qDescription: '在ps中，b是的画笔的快捷键对么？', answer: true },
        { qId: 9, qDescription: '在ps中，ctrl+r是自由绽放的快捷键对么？', answer: false }, { qId: 10, qDescription: '在ps中，g是复制的快捷键对么？', answer: false }
    ],
    answersArr: [],  //答题情况
    totalScores: 0,  //总分

    /*连击情况*/
    doubleHitNums: 0,
    doubleHitNumsArr: [],

    /*已答总题数*/
    totalDoneQuestionsNum: 0,

    /*最后一题的答题情况*/
    lastOneAnswerFlag: false,

    /**初始化游戏**/
    initialize: function () {
        this.$cWrapper = $('.contentWrapper');
        this.$gWrapper = $('.gameContentWrapper');
        this.$gOverWrapper = $('.gameOverWrapper');
        this.eventsInit();
    },

    /*事件注册*/
    eventsInit: function () {

        var $btns = this.$cWrapper.find('.btns');
        var $recorders = this.$cWrapper.find('.gameRecords');
        var that = this;

        /*开始游戏  | 查看记录*/
        $btns.on('click', 'div', function () {
            var index = $(this).index();
            if (index == 1) {
                $btns.hide();
                $('.gameRecords').show();
            } else {
                that.showGameContentWrapper();
            }
        });

        /*关闭记录*/
        $recorders.on('click', '.closeGameRecords', function () {
            $btns.show();
            $recorders.hide();
        });

        /*题目答案选择*/
        that.$gWrapper.on('click', '.gameContentBtns>div', function () {
            var $q = that.$gWrapper.find('.gameContentQuestion'),
                  qid = $q.attr('data-qid'),  //当前题号
                  currentAnswer = !$(this).index();//当前题号的答案


            //保存所回答问题
            that.answersArr.push({
                qid: qid,
                answer: currentAnswer
            });

            /*当前题目答题情况判断*/
            that.checkoutCurrentAnswer(qid, currentAnswer);

            that.fillInQuestionToDom();   //随机出题
        });

        /*分享和 再来一局*/
        that.$gOverWrapper.on('click', '.oneMoreTime', function () {
            var index = $(this).index();
            if (index == 1) {
                that.restarGame();
            }
        });
    },

    /*
    *开始游戏
    *需要执行以下过程：1.从服务器取题库；2.随机从得到的题中选择一题；3.开始计时
    */
    showGameContentWrapper: function (imgSrc) {
        this.$cWrapper.hide();
        this.swapClass($('.gameContentWrapper'), 'gameContentWrapperHide', 'gameContentWrapperShow');
        this.getQuestionsFromService(function (data) {
            this.questionsArr = data;
            this.fillInQuestionToDom();   //随机出题
            this.initTimeDetailInfo();//初始化时间
            this.setTimeOutInfo(1000);
        });
    },

    /*从服务器取题目*/
    getQuestionsFromService: function (callback) {
        var that = this;
        data = this.questionsArr;
        callback.call(that, data);
        //$.post('', null, function (data) {
        //    callback.call(that, data);
        //});

    },

    /*
    *当前题目对错判断
    *Parameters:
    *qid:{string} 当前题号id,
    *currentAnswer:{bool}当前选择答案 true | false
    */
    checkoutCurrentAnswer: function (qid, currentAnswer) {
        window.clearInterval(this.timeInterval);  /*暂停计时器*/
        var that = this,
            $p = this.$gWrapper.find('.doubleHitInfo > p'),
            $hitNums = $p.find('.doubleHitNums');
        var temp = $.grep(that.questionsArr, function (item, key) {
            return item.qId == qid;
        })[0];

        //答题正确
        if (temp.answer == currentAnswer) {
            this.doubleHitNums++;
            $hitNums.text(this.doubleHitNums);
            if (this.doubleHitNums > 1) {
                $p.addClass('doubleHitNumsShow');
            }
            that.lastOneAnswerFlag = true;
        }

            //答题错误
        else {
            $p.removeClass('doubleHitNumsShow');
            this.doubleHitNumsArr.push(this.doubleHitNums);
            this.doubleHitNums = 0;
            that.lastOneAnswerFlag = false;
            $('.wrongAnsweInfo').addClass('wrongAnsweInfoShow');
        }

        /*重启计时器*/
        this.timeInterval = window.setTimeout(function () {
            $('.wrongAnsweInfo').removeClass('wrongAnsweInfoShow');
            $p.removeClass('doubleHitNumsShow');
            that.setTimeOutInfo(0);
        }, 500);
    },

    /*填充问题内容*/
    fillInQuestionToDom: function () {
        var $q = this.$gWrapper.find('.gameContentQuestion'),
              oQId = $q.attr('data-qid'),
             qInfo = this.showQuestionByRandom(oQId);
        $q.attr('data-qid', qInfo.qId);
        $q.find('p').text(qInfo.qDescription);
        this.changeQuestionTileAndBg();
    },

    /*随机出题*/
    showQuestionByRandom: function (oQId) {
        var index = this.getRandomNum(this.questionsArr.length);
        var qIf = this.questionsArr[index];
        if (qIf && oQId != qIf.qId) {
            return qIf;
        } else {
            return this.showQuestionByRandom(oQId);
        }
    },

    /*更换题号和背景图*/
    changeQuestionTileAndBg: function () {
        this.totalDoneQuestionsNum++;
        var questionNumImg = '../images/gamecontent/n' + this.totalDoneQuestionsNum + '.png',
            bgImg = '../images/gamecontent/p' + this.getRandomNum(1, 5) + '.png';
        this.$gWrapper.find('.gameContentPeople').css('background-image', 'url(' + bgImg + ')');
        this.$gWrapper.find('.questionNum').css('background-image', 'url(' + questionNumImg + ')');
    },

    /*设置计时器*/
    setTimeOutInfo: function (num) {
        var that = this;
        var $timeLabel = this.$gWrapper.find('.timeDetailInfo');
        window.setTimeout(function () {
            that.timeInterval = window.setInterval(function () {
                that.updateTimeShowInfo.call(that, $timeLabel);
            }, 10);
        }, num);
    },

    /*初始化最大时间*/
    initTimeDetailInfo: function () {
        this.$gWrapper.find('.timeDetailInfo').text(this.maxTimeStr);
    },

    /*更新显示出来的时间*/
    updateTimeShowInfo: function ($label) {
        var numArr = $label.text().split(':'),
            numS = numArr[1] | 0,
            numMs = numArr[2] | 0;
        if (numS == 0 & numMs == 0) {
            num = ('00:00:00');
            this.gameOver();
        } else {
            if (numMs == 0) {
                numMs = 99;
                numS--;
            }
        }
        if (numS < 10) {
            numS = '0' + numS;
        }
        numMs -= 1;
        $label.text('00:' + numS + ':' + numMs);

    },

    /*
    *游戏结束
    *得到具体的 答对情况数组,true表示正确，false表示错误：[true,false,false,false,false,false,true]
    */
    gameOver: function () {
        console.log('时间到！');
        window.clearInterval(this.timeInterval);
        this.showGameResultPanel();  //显示本次游戏结果
        this.commitResultToService();//将游戏结果传到服务器
    },

    /*
    *游戏得分计算
    *根据连击情况计算分数
    *计算规则 ：24 的 n次方
    *   2连击*2  +576分
    *   3连击*3  +13824分
    *   4连击*4  +331776分
    *
    */
    calculateScroes: function () {
        var scores = 0;

        //最一次答案，防止在没有出现错题的情况下，没有进行连击的计算
        if (this.lastOneAnswerFlag) {
            this.doubleHitNumsArr.push(this.doubleHitNums);
        }
        $.each(this.doubleHitNumsArr, function () {
            if (this != 0) {
                scores += Math.pow(24, this);
            }
        });
        return scores;
    },

    /*将游戏结果传到服务器*/
    commitResultToService: function () {

    },

    /*显示本次游戏和排行*/
    showGameResultPanel: function () {
        this.$gOverWrapper.show();
        $('#totalScores').text(this.calculateScroes());
        this.swapClass(this.$gWrapper, 'gameContentWrapperShow', 'gameContentWrapperHide');
        this.swapClass(this.$gOverWrapper.find('.gameResultPanel'), 'gameResultPanelHide', 'gameResultPanelShow');
        this.swapClass(this.$gOverWrapper.find('.gameRankingListPanel'), 'gameRankingListPanelHide', 'gameRankingListPanelShow');
    },

    /*
    *重新开始游戏
    *需要执行以下过程：
    *1.显示首页，隐藏当前的页面。
    *2.页面效果 之前出现的效果类要去除包括：
    *   游戏主面板的 滑入效果，结果板的 掉下效果
    *3.清除上次游戏信息 计时的数字改成30s
    *
    */
    restarGame: function () {
        this.clearGameInfo();  //清除上次游戏信息
        this.$cWrapper.delay(500).show(0);

        this.swapClass(this.$gWrapper, 'gameContentWrapperShow', 'gameContentWrapperHide');
        this.swapClass(this.$gOverWrapper.find('.gameResultPanel'), 'gameResultPanelShow', 'gameResultPanelHide');
        this.swapClass(this.$gOverWrapper.find('.gameRankingListPanel'), 'gameRankingListPanelShow', 'gameRankingListPanelHide');
    },

    /*清除上次游戏信息*/
    clearGameInfo: function () {
        $('#totalScores').text('');
        this.totalScores = 0;
        this.answersArr = [];
        this.doubleHitNums = 0;
        this.doubleHitNumsArr = [];
        this.totalDoneQuestionsNum = 0;
    },

    /*
    *得到随机数
    *Parameters:
    *minNum - {int} 可能出现的最小值
    *maxNum - {int} 可能出现的最大值
    *Returns:
    *num - {int} 得到的随机数
    */
    getRandomNum: function (maxNum, minNum) {
        if (!minNum) {
            minNum = 0;
        }
        var range = maxNum - minNum;
        var index = Math.round(Math.random() * range) + minNum;
        return index;
    },

    /*
    *样式转换
    *Parameters:
    *$target - {jquery object} jquery对象
    *oClass - {string} 旧类
    *nClass - {string} 
    */
    swapClass: function ($target, oClass, nClass) {
        $target.removeClass(oClass).addClass(nClass);
    },

    OBJECT_NAME: 'game'
};

/*angularjs 数据绑定*/
var app = angular.module('myApp', []);
app.controller('gameRecordsController', function ($scope, $http) {
    var data = [{ name: '神级设计尸', date: '2015.9.28', scores: '45665分' }, { name: '新东方厨师', date: '2015.9.28', scores: 42665 },
        { name: '千年老尸', date: '2015.9.28', scores: 40665 }, { name: '苍老师', date: '2015.9.28', scores: 35665 },
        { name: '撸大湿', date: '2015.9.28', scores: 25665 }, { name: '村口王师傅', date: '2015.9.28', scores: 15665 }];
    $scope.items = data;
    //$http({
    //    method: 'POST',
    //    url: '/Shop/Products',
    //    data: { fileInfo: 'dds' },
    //    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },

    //}).success(function (data) {
    //    data = JSON.parse(data);
    //    $scope.items = data;
    //}).error(function () {
    //    alert('error');
    //});
});