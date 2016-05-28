/**
 * http://usejsdoc.org/
 */
module.exports = {
    sleep: function(s) {
      var e = new Date().getTime() + (s * 1000);

      while (new Date().getTime() <= e) {
        ;
      }
    },

    usleep: function(s) {
      var e = new Date().getTime() + (s / 1000);

      while (new Date().getTime() <= e) {
        ;
      }
    }
  };