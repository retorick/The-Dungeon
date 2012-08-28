<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title></title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <script src="../js/jquery-1.8.0.js"></script>
  <link rel="stylesheet" href="css/svg.css"/>
  <script type="text/javascript" src="../raphael/raphael-min.js"></script>
  <script type="text/javascript" src="js/us_data.js"></script>
  <script type="text/javascript" src="js/quiz.js"></script>
  <script type="text/javascript" src="js/map_quiz.js"></script>
</head>
<body>

<div id="container" style="position:relative">

  <div class="answer_container">
    State Capital
    <input type="text" id="answer"/>
  </div>

  <div id="incorrect" class="response">
    <div class="close"><p>x</p></div>
    <p>Wrong!<br/><span id="expected"></span></p>
  </div>

</div>
<script type="text/javascript">
Raphael(10, 10, 600, 400, function() {
    var r = this;
    
    r.setStart();
    for (var state in us) {
        r.path(us[state].path)
            .attr({stroke: 'white', fill: '#ccc', 'stroke-opacity': 0.5})
            .data('abbr', state)
            .data('name', us[state].name)
            .data('capital', us[state].capital);
    }
    var us_map = r.setFinish();
    us_map.scale('.5, .5, 0, 0');

    var svg = document.getElementsByTagName('svg')[0];
    $('#container').append(svg);
    MapQuiz.init(r);
    MapQuiz.beginQuiz();
});

$(function() {
    $('#answer').val('').focus();

    $('#answer').focus(function() {
        $(this).select();
    });

    $('#incorrect .close').click(function(e) {
        $(this).parent().hide();
        $('#answer').val('').focus();
    });

});
</script>
</body>
</html>
