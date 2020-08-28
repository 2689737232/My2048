/**
 @description:  简直就是狗屎。
 @modifyContent:
 @author: lala
 @date: 2020-07-09 10:42:51
*/
(function (configuration) {
    /**
    * 工厂
    */
    let factory = {
        container: {},
        setInstance(config, name) {
            container[name] = config
        },
        getInstanceName(name) {
            return new Block(container[name])
        }
    }


    let gameFieldWrapper = null,  // 棋盘中的包裹层，方便样式的添加修改。以减少对棋盘的影响。
        blockContainer = null, // 小方块的容器，为一个二维数组
        isStartGame = false,  
        blockWidth = null,   // 每个小方块的宽度
        blockHeight = null, // 每个小方块的高度 ,
        flag = true,    // 移动锁，防止点击过快
        colorMap = {
            "0": "#ccc0b3",
            "2": "#eee4da",
            "4": "#ede0c8",
            "8": "#f2b179",
            "16": "#f59563",
            "32": "#f67e5f",
            "64": "#f65e3b",
            "128": "#edcf72",
            "256": "#edcc61",
            "512": "#9c0",
            "1024": "#33b5e5",
            "2048": "#09c",
            "4096": "#5b67ff"
        };

    /**
     * @description 初始化事件绑定
     */
    function initEvent() {
        let stratBtn = document.getElementsByClassName('start-btn')[0],
            resetBtn = document.getElementsByClassName('reset-btn')[0];
        stratBtn.onclick = function () {
            if (!isStartGame) {
                generateBlock(blockContainer, configuration);
                isStartGame = !isStartGame;
            }
        }
        resetBtn.onclick = function () {
            initBlockContainer(configuration.size);
            initGameFieldWrapper();
            isStartGame = !isStartGame;
        }

        window.onkeydown = function (e) {
            e.preventDefault();
            if (flag) {
                keydownHandle(e.keyCode, blockContainer);
            }
        }
    }

    /**
     * @description 初始化小方块的二维数组
     * @param {Number} size  棋盘规模
     */
    function initBlockContainer(size) {
        blockContainer = new Array(size);
        for (var i = 0; i < blockContainer.length; i++) {
            blockContainer[i] = new Array(size);
        }
        nextStep();
        nextStep();
    }


    /**
     *  @description 初始化棋盘中的包裹层，方便样式的添加修改。以减少对棋盘的影响。
     */
    function initGameFieldWrapper() {
        configuration.gameField.innerHTML = "";
        gameFieldWrapper = document.createElement("div");
        setElStyle(gameFieldWrapper, {
            "position": "relative",
            "display": "flex",
            "width": "100%",
            "height": "100%",
            "border": "1px solid",
            "flexWrap": "wrap",
            "boxSizing": "border-box",
            "background": "rgb(245, 196, 135)"
        });
        configuration.gameField.appendChild(gameFieldWrapper);
        // 根据棋盘的大小初始化每个方块的尺寸
        updateBlockSize(gameFieldWrapper, configuration.size, configuration.gap);
    }

    /**
     * @description 根据棋盘gameFieldWrapper、规模和间隙 更新全局小方块的尺寸
     * @param {Element} element 
     * @param {Number} size 
     * @param {Number} gap 
     */
    function updateBlockSize(element, size, gap) {
        let length = element.clientWidth;
        height = (length - (size + 1) * gap) / 4;
        width = height;
    }
    /**
     * @description 根据每个小方块的位置和全局属性宽高获取每个小方块自己移动的距离
     * @param {Element} element 
     * @param {Number} size 
     * @param {Number} gap 
     */
    function getBlockMoveDistance(row, column, gap) {
        let top = Number(row * width) + Number(gap) * (row + 1) + "px",
            left = Number(column * height) + Number(gap) * (column + 1) + "px";
        return {
            left,
            top
        }
    }

    /**
     * 游戏中生成的小方格类
     * @class Block
     * @constructor
     * @param {Object} config 初始化小方格
     */
    function Block(config) {
        // 装饰池 用于保存需要执行的装饰方法
        // 里面保存的是对象，每个对象有 name和arguments  name表示装饰方法，arguments表示这个方法的参数
        this.decoratePool = [];
        this.el = config.el;
        this.row = config.row;
        this.column = config.column;
        this.color = config.color;
        this.score = config.score;
        // 合并的小方块
        this.mergeBlock = null;
    }

    /**
     * @description 用于保存所有用于装饰的方法，通过decorate方法添加到decoratePool中。通过apply应用装饰池中的方法。
     */
    Block.prototype.decorateMethod = {
        // 用于表示 小方块是否是消除的状态
        setRemove(isRemove) {
            this.isRemove = isRemove;
        }
    }
    /**
     * @description 添加装饰方法到 decoratePool 通过apply方法装饰
     * @param {String} name 装饰的方法名字 
     * @param {*} arguments  该方法的参数
     */
    Block.prototype.decorate = function (name, arguments) {
        let property = {
            name,
            arguments
        };
        this.decoratePool.push(property)
    }
    // 应用所有装饰的方法
    Block.prototype.apply = function () {
        let decoratePool = this.decoratePool;
        decoratePool.forEach(function (el, i) {
            this.decorateMethod.apply(el.name, el.arguments);
        });
    }

    /**
     * @description 根据棋盘大小随机生成下一个出现的方块，2 或 4
     * @param {Array} blockContainer  存小方块的二维数组  
     * @param {Object} configuration   配置信息
     */
    function generateBlock(blockContainer, configuration) {


        // 随机生成的列和行的范围和获取方块的模板
        let scope = blockContainer.length,
            template = document.createElement("div");
        // 为template添加类名，方便css添加样式
        for (var i = 0; i < configuration.templateClass.length; i++) {
            template.classList.add(configuration.templateClass[i])
        }

        // 随机产生行和列
        let randomRow = Math.floor(Math.random() * scope),
            randomColumn = Math.floor(Math.random() * scope);
        // 如果是已经有方块的位置重新生成
        while (blockContainer[randomRow][randomColumn]) {

            randomRow = Math.floor(Math.random() * 4);
            randomColumn = Math.floor(Math.random() * 4);
            // 如果生成的位置为空就退出循环
            if (!blockContainer[randomRow][randomColumn]) {
                break;
            }
        }// 添加分数显示
        let score = Math.random() > 0.3 ? 2 : 4
        template.innerHTML = score;

        // 获取随机产生的元素  创建小方块对象
        blockContainer[randomRow][randomColumn] = new Block({
            el: template,
            row: randomRow,
            column: randomColumn,
            color: "#ffffff",
            score: score
        });

        // 将创建好的方块插入到棋盘中
        insertElIntoGameFiled(blockContainer[randomRow][randomColumn], gameFieldWrapper, configuration.gap);
    }

    /**
     @description: 游戏结束判断 
     @modifyContent:
     @author: lala
     @date: 2020-08-07 16:14:42
    */
    function endJudge() {
        let num = 0;
        for (var i = 0; i < blockContainer.length; i++) {
            for (var j = 0; j < blockContainer.length; j++) {
                if (blockContainer[i][j]) {
                    num++;
                }
            }
        }
        if (num == 16) {
            alert("游戏结束");
            return true;
        } else {
            return false;
        }
    }


    /**
     * @description 根据实例化的方块的位置，插入元素到棋盘中
     * @param {Block} template  实例化的小方格 2 或 4
     * @param {*} gameField  游戏的棋盘，生成的小方格在里面
     * @param {*} size  游戏的规模 如 4x4 size就是4
     */
    function insertElIntoGameFiled(template, element, gap) {
        // 获取第几行第几列
        let row = template.row,
            column = template.column;
        // 获取本次生成的方块移动的距离
        let moveObj = getBlockMoveDistance(row, column, gap);
        // 设置元素的样式
        setElStyle(template.el, {
            "position": "absolute",
            "left": moveObj.left,
            "top": moveObj.top,
            "width": width + "px",
            "height": height + "px",
            "backgroundColor": template.color,
            "boxShadow": "-1 0 30px 10px rgba(243, 215, 116, 0), inset 0 0 0 1px rgba(255, 255, 255, 0)",
            "borderRadius": "4px",
            "fontSize": width / 2.5 + "px",
            "fontFamily": "幼圆",
            "fontWeight": "bolder",
            "textAlign": "center",
            "lineHeight": width + "px",
            "transition": "all 0.1s linear"
        });
        // 将方块对象中的元素添加到棋盘中
        element.appendChild(template.el);
    }

    /**
     @description: 下一个方块生成 
     @modifyContent:
     @author: lala
     @date: 2020-08-07 16:15:58
    */
    function nextStep() {
        // 游戏判断 
        if (!endJudge()) {
            setTimeout(function () {
                //  移动完后继续生成小方块
                generateBlock(blockContainer, configuration);
                flag = true;
            }, 100)
        }
    }

    /** 
     * @description 点击游戏按钮后移动游戏中的小方块   键盘按下事件  上： 38  下： 40 左： 37 右 39。！shit ！
     * @param {Number} keyCode  按下的键盘代码
     * @param {Array} blockContainer 小方块容器
     */
    function keydownHandle(keyCode, blockContainer) {
        // 加锁判断
        if (flag) {
            switch (keyCode) {
                // 上
                case 38:
                    // 往上的判断
                    flag = false;
                    // 循环遍历每个元素，判断是否可以移动。
                    for (var i = 0; i < blockContainer.length; i++) {
                        let blockSet = [];
                        for (var j = 0; j < blockContainer.length; j++) {
                            // 将一列中不为空的元素添加到新集合中
                            if (blockContainer[j][i]) {
                                blockSet.push(blockContainer[j][i]);
                            }
                        }
                        let newColumnSet = getProcessedSet(blockSet);
                        // 循环处理每一列
                        for (var j = 0; j < blockContainer.length; j++) {
                            if (newColumnSet[j]) {
                                blockContainer[j][i] = newColumnSet[j]
                                blockContainer[j][i].row = j;
                                blockContainer[j][i].column = i;
                            } else {
                                blockContainer[j][i] = null;
                            }
                        }
                    }
                    // 添加动画
                    addAnimate();
                    // 下一步游戏
                    nextStep();
                    break;
                // 下
                case 40:
                    // 往上的判断
                    flag = false;
                    // 循环遍历每个元素，判断是否可以移动。
                    for (var i = 0; i < blockContainer.length; i++) {
                        let blockSet = [];

                        for (var j = 0; j < blockContainer.length; j++) {
                            // 将一列中不为空的元素添加到新集合中
                            if (blockContainer[j][i]) {
                                blockSet.push(blockContainer[j][i]);
                            }
                        }

                        let newColumnSet = getProcessedSet(blockSet.reverse()).reverse();
                        for (var k = 0; k < blockContainer.length; k++) {
                            if (newColumnSet.length < 4) {
                                newColumnSet.unshift(null);
                            }
                        }
                        // 循环处理每一列
                        for (var j = 0; j < blockContainer.length; j++) {
                            if (newColumnSet[j]) {
                                blockContainer[j][i] = newColumnSet[j];
                                blockContainer[j][i].row = j;
                                blockContainer[j][i].column = i;
                            } else {
                                blockContainer[j][i] = null;
                            }
                        }

                    }
                    // 添加动画
                    addAnimate();
                    // 下一步游戏
                    nextStep();
                    break;
                // 左
                case 37:
                    // 往上的判断
                    flag = false;
                    // 循环遍历每个元素，判断是否可以移动。
                    for (var i = 0; i < blockContainer.length; i++) {
                        let blockSet = [];

                        for (var j = 0; j < blockContainer.length; j++) {
                            // 将一列中不为空的元素添加到新集合中
                            if (blockContainer[i][j]) {
                                blockSet.push(blockContainer[i][j]);
                            }
                        }

                        let newColumnSet = getProcessedSet(blockSet);
                        // 循环处理每一列
                        for (var j = 0; j < blockContainer.length; j++) {
                            if (newColumnSet[j]) {
                                blockContainer[i][j] = newColumnSet[j]
                                blockContainer[i][j].row = i;
                                blockContainer[i][j].column = j;
                            } else {
                                blockContainer[i][j] = null;
                            }
                        }

                    }
                    // 添加动画
                    addAnimate();
                    // 下一步游戏
                    nextStep();
                    break;
                // 右
                case 39:
                    // 往上的判断
                    flag = false;
                    // 循环遍历每个元素，判断是否可以移动。
                    for (var i = 0; i < blockContainer.length; i++) {
                        let blockSet = [];

                        for (var j = 0; j < blockContainer.length; j++) {
                            // 将一列中不为空的元素添加到新集合中
                            if (blockContainer[i][j]) {
                                blockSet.push(blockContainer[i][j]);
                            }
                        }

                        let newColumnSet = getProcessedSet(blockSet.reverse()).reverse();
                        for (var k = 0; k < blockContainer.length; k++) {
                            if (newColumnSet.length < 4) {
                                newColumnSet.unshift(null);
                            }
                        }
                        // 循环处理每一列
                        for (var j = 0; j < blockContainer.length; j++) {
                            blockContainer[i][j] = newColumnSet[j];
                            if (newColumnSet[j]) {
                                blockContainer[i][j].row = i;
                                blockContainer[i][j].column = j;
                            }
                        }

                    }
                    // 添加动画
                    addAnimate();
                    // 下一步游戏
                    nextStep();
                    break;
            }
        }
    }

    // 添加动画
    function addAnimate() {
        for (var i = 0; i < blockContainer.length; i++) {
            for (var j = 0; j < blockContainer.length; j++) {
                // 移动更新后的容器
                if (blockContainer[i][j]) {
                    let block = blockContainer[i][j];
                    moveBlock(block);
                    // 如果是合并的容器更新数字、移动合并的方块并销毁
                    if (block.mergeBlock) {
                        mergeBlock(block);
                        makeFadeAway(block);
                        setElStyle(block.el, {
                            "backgroundColor": colorMap[block.score]
                        })
                    }

                }
            }
        }
    }
    // 返回处理完成的一列
    function getProcessedSet(set) {
        if (set) {
            let processedSet = [];
            for (var i = 0; i < set.length; i++) {
                processedSet.push(set[i]);
                if (set[i] && set[i + 1]) {
                    if (set[i].score == set[i + 1].score) {
                        set[i].mergeBlock = set[i + 1];
                        i++;
                    }
                }
            }
            return processedSet;
        }
    }
    function moveBlock(block) {
        // 重新获取移动距离
        let distanceObj = getBlockMoveDistance(block.row, block.column, configuration.gap);
        // 设置样式移动
        setElStyle(block.el, {
            "left": distanceObj.left,
            "top": distanceObj.top
        })
    }
    function mergeBlock(block) {
        block.score *= 2;
        block.el.innerText = block.score;

    }
    // 移除el元素 
    function makeFadeAway(block) {
        let r = block.row,
            c = block.column;
        // 重新获取移动距离
        let distanceObj = getBlockMoveDistance(r, c, configuration.gap);
        // 设置样式移动
        setElStyle(block.mergeBlock.el, {
            "left": distanceObj.left,
            "top": distanceObj.top
        });
        setTimeout(function () {
            block.mergeBlock.el.remove();
            block.mergeBlock = null;
        }, 100)
    }

    /**
        * @description 根据样式列表 脚本话el的css
        * @param {Element} el  dom元素
        * @param {Object} styleList 样式列表 
        */
    function setElStyle(el, styleList) {
        for (let p in styleList) {
            el.style[p] = styleList[p];
        }
    }



    // 初始化棋盘中的包裹层
    initGameFieldWrapper(configuration.size);
    // 初始化棋盘的规模
    initBlockContainer(configuration.size);
    // 初始化事件绑定
    initEvent();
})({
    size: 4,
    baseNumber: 2,
    score: 0,
    template: document.createElement("div"),   // 背景模板方块
    templateClass: ["background-block"],// 背景模板类名
    gameField: document.getElementsByClassName('game-field')[0], // 棋盘,
    template: document.createElement("div"), // 生成的小方块的模板
    gap: "10"   // 之间的间隙 单位px
})

