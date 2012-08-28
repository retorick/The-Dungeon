var MapQuiz;

MapQuiz = (function() {
  var obj, self, _callAttentionToItem, _hideResponse, _presentItem, _quizItems, _removeAttentionFromItem, _selectRandomItem, _showResponseCorrect, _showResponseIncorrect;
  self = this;
  _quizItems = QuizItemCollection.get();
  _hideResponse = function() {
    var el, els, _i, _len;
    els = document.getElementsByClassName('response');
    for (_i = 0, _len = els.length; _i < _len; _i++) {
      el = els[_i];
      el.style.display = 'none';
    }
    document.getElementById('state_name').value = '';
    document.getElementById('state_name').focus();
  };
  _showResponseCorrect = function() {
    document.getElementById('correct').style.display = 'block';
  };
  _showResponseIncorrect = function(expected) {
    document.getElementById('expected').innerHTML = expected;
    document.getElementById('incorrect').style.display = 'block';
  };
  _selectRandomItem = function() {
    self.currentQuizItem = _quizItems.selectRandomItem();
  };
  _removeAttentionFromItem = function() {
    if (self.currentQuizItem) self.currentQuizItem.unhighlight();
  };
  _callAttentionToItem = function() {
    self.currentQuizItem.highlight();
  };
  _presentItem = function(next) {
    if (next == null) next = true;
    _removeAttentionFromItem();
    if (!_quizItems.empty()) {
      if (next) _selectRandomItem();
      _callAttentionToItem();
    } else {
      alert("Done!");
    }
  };
  obj = {
    init: function(rObj) {
      document.getElementById('check_answer').onclick = function() {
        var _answer;
        _answer = document.getElementById('answer').value;
        MapQuiz.checkAnswer(_answer);
        return false;
      };
      document.getElementById('answer').focus();
      this.rObj = rObj;
      rObj.forEach(function(el) {
        return _quizItems.add(new QuizItem({
          id: el.id,
          contextObj: rObj,
          asked: false,
          remedial: false,
          correctResponse: el.data('capital'),
          highlightFn: (function(obj, id) {
            return function() {
              obj.getById(id).animate({
                fill: 'red'
              }, 1500);
            };
          })(rObj, el.id),
          unhighlightFn: (function(obj, id) {
            return function(remedial) {
              var _color;
              _color = !remedial ? 'green' : 'orange';
              obj.getById(id).animate({
                fill: _color
              }, 500);
            };
          })(rObj, el.id)
        }));
      });
    },
    beginQuiz: function() {
      _presentItem();
    },
    checkAnswer: function(answer) {
      var _getNextItem, _isCorrect;
      _isCorrect = self.currentQuizItem.isCorrectAnswer(answer);
      _getNextItem = true;
      if (_isCorrect) {
        _showResponseCorrect();
      } else {
        _showResponseIncorrect(self.currentQuizItem.correctResponse);
        _getNextItem = false;
      }
      _presentItem(_getNextItem);
    }
  };
  return obj;
})();
