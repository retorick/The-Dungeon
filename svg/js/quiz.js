var QuizItem, QuizItemCollection, _QICollection;

QuizItemCollection = (function() {
  var _instance;

  function QuizItemCollection() {}

  _instance = void 0;

  QuizItemCollection.get = function() {
    return _instance != null ? _instance : _instance = new _QICollection;
  };

  return QuizItemCollection;

})();

_QICollection = (function() {
  var _addToPool, _addToQuizItems, _addToRemedial, _findKeyInPool, _getPoolSize, _pool, _putRemedialBackInPool, _quizItems, _refreshPool, _remedialPool, _remedialPoolObj, _removeFromPool;

  function _QICollection() {}

  _quizItems = [];

  _pool = [];

  _remedialPoolObj = {};

  _remedialPool = [];

  _refreshPool = function() {
    var i, q, _len;
    for (i = 0, _len = _quizItems.length; i < _len; i++) {
      q = _quizItems[i];
      if (q.remedial || !q.asked) _pool.push(q);
    }
    return _pool;
  };

  _addToQuizItems = function(qiObj) {
    _quizItems.push(qiObj);
  };

  _addToPool = function(qiObj) {
    _pool.push(qiObj);
  };

  _addToRemedial = function(qiObj) {
    _remedialPoolObj[qiObj.id] = qiObj;
  };

  _removeFromPool = function(ndx, remedial) {
    var _removedItem;
    _removedItem = _pool.splice(ndx, 1)[0];
    if (remedial) _addToRemedial(_removedItem);
  };

  _putRemedialBackInPool = function() {
    var _key, _qi;
    for (_key in _remedialPoolObj) {
      _qi = _remedialPoolObj[_key];
      _qi.remedial = false;
      _pool.push(_qi);
    }
    _remedialPoolObj = {};
    return _pool.length;
  };

  _findKeyInPool = function(key) {
    var i, p, _len;
    for (i = 0, _len = _pool.length; i < _len; i++) {
      p = _pool[i];
      if (p.id === key) return i;
    }
    return null;
  };

  _getPoolSize = function() {
    return _pool.length;
  };

  /*
      Add quiz item to pool, by quiz item object.
  */

  _QICollection.prototype.add = function(qi) {
    _addToQuizItems(qi);
    _addToPool(qi);
  };

  /*
      Remove quiz item from pool, by key.
  */

  _QICollection.removeFromPool = function(key, remedial) {
    var _pndx;
    _pndx = _findKeyInPool(key);
    if (_pndx !== null) _removeFromPool(_pndx, remedial);
  };

  /*
      Select random quiz item from pool. Return quiz item object.
  */

  _QICollection.prototype.selectRandomItem = function() {
    var _ndx;
    _ndx = Math.floor(Math.random() * _getPoolSize());
    return _pool[_ndx];
  };

  /*
      Check to see if pool is empty.  If it is, put remedial items back in, and
      check again.  If pool is still empty, return true.
  */

  _QICollection.prototype.empty = function() {
    if (_pool.length !== 0) {
      return false;
    } else {
      _putRemedialBackInPool();
      return _pool.length === 0;
    }
  };

  return _QICollection;

})();

QuizItem = (function() {

  function QuizItem(data) {
    this.contextObject = data.contextObj;
    this.id = data.id;
    this.asked = data.asked;
    this.remedial = data.remedial;
    this.correctResponse = data.correctResponse;
    this.highlightFn = data.highlightFn;
    this.unhighlightFn = data.unhighlightFn;
  }

  QuizItem.prototype.unhighlight = function() {
    return this.unhighlightFn(this.remedial);
  };

  QuizItem.prototype.highlight = function() {
    return this.highlightFn();
  };

  QuizItem.prototype.hasBeenAsked = function() {
    return this.asked;
  };

  QuizItem.prototype.isCorrectAnswer = function(answer) {
    var _correct;
    _correct = answer === this.correctResponse;
    if (_correct) {
      this.markCorrect();
    } else {
      this.markIncorrect();
    }
    _QICollection.removeFromPool(this.id, this.remedial);
    return _correct;
  };

  QuizItem.prototype.markCorrect = function() {
    this.asked = true;
  };

  QuizItem.prototype.markIncorrect = function() {
    this.asked = true;
    this.remedial = true;
  };

  return QuizItem;

})();
