//スライダーの情報を取得（戻り値eval済み）
//var info = getSliderInfo('a');
function getSliderInfo(sliderName) {
    //xmlデータを取得
    var xmlStr = ggbApplet.getXML(sliderName);

    //DOMにパース
    var parser = new DOMParser();
    var dom = parser.parseFromString(xmlStr, "text/xml");

    //sliderタグ内の情報を取得
    var sld = dom.getElementsByTagName('slider');

    //オブジェクトがスライダーでない場合、undefinedを返して終了
    if (sld.length == 0) {
        return undefined;
    }

    //オブジェクトとしてアウトプット
    var output = new Object();
    for (var k = 0; k < sld[0].attributes.length; k++) {
        var nameText = sld[0].attributes[k].name;
        var val = sld[0].attributes[k].value;
        output[nameText] = eval(val);
    }

    //始点
    var startX = output.x;
    var startY = output.y;
    if (output.absoluteScreenLocation) {
        startX = ggbApplet.getValue('x(Corner[1])+(x(Corner[3])-x(Corner[1]))*((' + startX + '+1)/(x(Corner[5])+2))');
        startY = ggbApplet.getValue('y(Corner[3])-(y(Corner[3])-y(Corner[1]))*((' + startY + '+1)/(y(Corner[5])+2))');
    } //ピクセル座標（画面上固定）の場合
    //console.log('始点:('+startX+','+startY+')');

    //console.log('width='+output.width);

    //終点
    var endX = output.x + (output.horizontal ? output.width : 0);
    var endY = output.y + (output.horizontal ? 0 : output.width);
    if (output.absoluteScreenLocation) {
        endX = ggbApplet.getValue(startX + '+(x(Corner[3])-x(Corner[1]))*((' + (output.horizontal ? output.width : 0) + ')/(x(Corner[5])+2))');
        endY = ggbApplet.getValue(startY + '+(y(Corner[3])-y(Corner[1]))*((' + (output.horizontal ? 0 : output.width) + ')/(y(Corner[5])+2))');
    } //ピクセル座標（画面上固定）の場合
    //console.log('終点:('+endX+','+endY+')');

    //outputに始点・終点情報を記録
    output['startX'] = startX;
    output['startY'] = startY;
    output['endX'] = endX;
    output['endY'] = endY;

    return output;
}

//handlerは、'click'ならonClick、それ以外ならonUpdate
//setJavaScript('k', 'update', scrText);
function setJavaScript(objName, handler, script) {
    //オブジェクト存在確認
    var isexist = ggbApplet.exists(objName);
    if (isexist) {
        var objType = ggbApplet.getObjectType(objName);
        var onwhat = (handler == 'click') ? 'val' : 'onUpdate';
        var xmlText = '<element type=\"' + objType + '\" label=\"' + objName + '\"><javascript ' + onwhat + '=\"' + script + '\"/></element>';
        ggbApplet.evalXML(xmlText);
    }
}

//テキストの開始位置を設定
//setTextStartPoint('text1','(3,4)');
//setTextStartPoint('text1','A');
//setTextStartPoint('text1','Midpoint[(0,0),(1,1)]');
function setTextStartPoint(objName, expText) {
    //オブジェクト存在確認
    var isexist = ggbApplet.exists(objName);

    if (isexist) {
        var objType = ggbApplet.getObjectType(objName);
        var xmlText = '<element type=\"' + objType + '\" label=\"' + objName + '\"><startPoint exp=\"' + expText + '\"/></element>';
        ggbApplet.evalXML(xmlText);
    }
}

//スライダー点を作成、スライダーにOn Updateスクリプト記述
//makeSliderPoint('k', 'l1', 0.05);
function makeSliderPoint(sliderName, listName, diff) {

    //スライダー情報を取得
    var info = getSliderInfo(sliderName);

    //スライダーでなければ処理終了
    if (!info) {
        return undefined;
    }

    //端点用の点オブジェクトを作成
    ggbApplet.evalCommand('StartOf' + sliderName + '=(0,0)');
    ggbApplet.evalCommand('GoalOf' + sliderName + '=(5,0)');

    //スライダーの最小値・最大値を記録する数値オブジェクトを作成
    var xmlTextMin = '<expression label=\"minOf' + sliderName + '\" exp=\"{0}\"/><element type=\"list\" label=\"minOf' + sliderName + '\"></element>';
    ggbApplet.evalXML(xmlTextMin);

    var xmlTextMax = '<expression label=\"maxOf' + sliderName + '\" exp=\"{0}\"/><element type=\"list\" label=\"maxOf' + sliderName + '\"></element>';
    ggbApplet.evalXML(xmlTextMax);

    //スライダー点を作成
    ggbApplet.evalCommand('PointOf' + sliderName + ' = Dilate(GoalOf' + sliderName + ', (' + sliderName + ' - minOf' + sliderName + '(1)) / (maxOf' + sliderName + '(1) - minOf' + sliderName + '(1)), StartOf' + sliderName + ')');

    //スライダーのOn Update スクリプトを記述（スライダー情報を記録、リスト付近吸い付き）
    var scrText = 'evalSliderInfo(&apos;' + sliderName + '&apos;,&apos;' + listName + '&apos;,'+diff+');';
    setJavaScript(sliderName, 'update', scrText);
}

//StartOf~, GoalOf~, minOf~, maxOf~にスライダー情報を書き込む。また、リスト付近で吸い付かせる。スライダーのupdateスクリプトに記述する用。
//evalSliderInfo('k', 'l1', 0.05);
function evalSliderInfo(sliderName, listName, diff) {

    //スライダー情報を取得
    var info = getSliderInfo(sliderName);

    //スライダーの端点の座標を、StartOf~とGoalOf~に記録
    ggbApplet.evalCommand('SetValue[StartOf' + sliderName + ',(' + info.startX + ',' + info.startY + ')]');
    ggbApplet.evalCommand('SetValue[GoalOf' + sliderName + ',(' + info.endX + ',' + info.endY + ')]');

    //スライダーの最小値、最大値を、min_a, max_aに記録
    ggbApplet.evalCommand('SetValue[minOf' + sliderName + ',{' + info.min + '}]');
    ggbApplet.evalCommand('SetValue[maxOf' + sliderName + ',{' + info.max + '}]');

    //リスト付近で吸い付き
    ggbApplet.evalCommand('If[abs(' + sliderName + '-x(ClosestPoint(Zip((α, 0), α, ' + listName + '), (' + sliderName + ', 0))))<'+diff+',SetValue[' + sliderName + ',x(ClosestPoint(Zip((α, 0), α, ' + listName + '), (' + sliderName + ', 0)))]]');
}

//ラベルを表すテキストを作成（吸い付き値のみsurd指定）
//makeLabelText('k','l1');
function makeLabelText(sliderName, listName) {

    //surdtextを作成
    ggbApplet.evalCommand('surdTextOf' + sliderName + '=\"' + sliderName + ' = \"+SurdText[' + sliderName + ']');
    //LaTeXをON
    var xmlSurdTextLatex = '<element type=\"text\" label=\"surdTextOf' + sliderName + '\"><isLaTeX val=\"true\"/></element>';
    ggbApplet.evalXML(xmlSurdTextLatex);

    //一般テキストを作成
    ggbApplet.evalCommand('commonTextOf' + sliderName + '=\"' + sliderName + ' = \"+' + sliderName);
    //LaTeXをON
    var xmlCommonTextLatex = '<element type=\"text\" label=\"commonTextOf' + sliderName + '\"><isLaTeX val=\"true\"/></element>';
    ggbApplet.evalXML(xmlCommonTextLatex);

    //Ifで条件分けしたテキストを作成
    ggbApplet.evalCommand('combinedTextOf' + sliderName + ' = If(' + sliderName + ' ≟ x(ClosestPoint(Zip((α, 0), α, ' + listName + '), (' + sliderName + ', 0))), surdTextOf' + sliderName + ', commonTextOf' + sliderName + ')');
    var xmlCombinedTextLatex = '<element type=\"text\" label=\"combinedTextOf' + sliderName + '\"><isLaTeX val=\"true\"/></element>';
    ggbApplet.evalXML(xmlCombinedTextLatex);
}

//上記の総括関数、各種オブジェクトのスタイルを調整
//snapSliderToListAndMakeSurdTextLabel('k','l1', 0.05);
function snapSliderToListAndMakeSurdTextLabel(sliderName, listName, diff) {

    //スライダー点を作成、スライダーにOn Updateスクリプト記述
    makeSliderPoint(sliderName, listName, diff);

    //ラベルを表すテキストを作成（吸い付き値のみsurd指定）
    makeLabelText(sliderName, listName);

    //update
    ggbApplet.evalCommand('UpdateConstruction[]');

    //surdTextOf~の開始位置を設定
    setTextStartPoint('surdTextOf' + sliderName, 'PointOf' + sliderName);

    //sliderの値をリストの第一要素に揃える
    ggbApplet.evalCommand('SetValue[' + sliderName + ',' + listName + '(1)]');

    //スタイル調整
    ggbApplet.setVisible('StartOf' + sliderName, false);
    ggbApplet.setVisible('GoalOf' + sliderName, false);
    ggbApplet.setVisible('minOf' + sliderName, false);
    ggbApplet.setVisible('maxOf' + sliderName, false);
    ggbApplet.setVisible('PointOf' + sliderName, false);
    ggbApplet.setVisible('surdTextOf' + sliderName, false);
    ggbApplet.setVisible('commonTextOf' + sliderName, false);

    ggbApplet.setAuxiliary('StartOf' + sliderName, true);
    ggbApplet.setAuxiliary('GoalOf' + sliderName, true);
    ggbApplet.setAuxiliary('minOf' + sliderName, true);
    ggbApplet.setAuxiliary('maxOf' + sliderName, true);
    ggbApplet.setAuxiliary('PointOf' + sliderName, true);
    ggbApplet.setAuxiliary('surdTextOf' + sliderName, true);
    ggbApplet.setAuxiliary('commonTextOf' + sliderName, true);

    ggbApplet.setLabelVisible('' + sliderName, false);
}