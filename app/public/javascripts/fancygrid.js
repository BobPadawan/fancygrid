(function($, undefined) {

  $.fn.fancygrid = function(method) {
    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if (typeof(method) === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error( 'Method ' + method + ' does not exist on jQuery.fancygrid' );
    }
  };

  var methods = {
    init : function(options){
      var settings = { 
        url       : "/", 
        name      : "", 
        query     : { 
          pagination : { page : 0, per_page : 20 }, 
          conditions : {},
          order      : {}
        },
        searchFadeTime  : 250,
        searchFadeOpac  : 0.5,
        queries : 0
      }
      options = (options || {});
      $.extend(settings, options);
      
      return this.each(function(){
        var $this = $(this);
        var data = $this.data('fancygrid');
        
        if (!data){
          // initialize fancygrid
          
          // set data
          $this.data('fancygrid', settings);
          
          // input field changed/focused binding
          changeActions = {
            ".js-attribute" : "newSearch",
            ".js-page"      : "page"
          }
          for (var k in clickActions){
            $this.find(k).bind("change.fancygrid", function(){
              $(this).parents(".js-fancygrid").fancygrid(clickActions[k]); 
              return false;
            }).bind("focus.fancygrid", function(){
              $(this).select();
              return false;
            });
          }
          
          // control buttons binding
          clickActions = {
            ".js-previous" : "previousPage",
            ".js-next"     : "nextPage",
            ".js-reload"   : "reloadPage",
            ".js-clear"    : "clearSearch",
            ".js-per-page" : "perPage",
            ".js-magnify"  : "toggleSearch"
          }
          for (var k in clickActions){
            $this.find(k).bind("click.fancygrid", function(){
              $(this).parents(".js-fancygrid").fancygrid(clickActions[k]); 
              return false;
            });  
          }

        } else {
          $.extend(data, options);
        }
      });
    },
    destroy : function(){
      return this.each(function(){
        var $this = $(this);
        data = $this.data('fancygrid');
        $this.unbind('.fancygrid');
        $this.removeData('fancygrid');
      });
    },
    setupConditions : function(){
      var $this = $(this);
      var data = $this.data('fancygrid');
      
      data.query.conditions = {};
      $(this).find(".js-attribute").each(function(){
        data.query.conditions[$(this).attr("name")] = $(this).val();
      });
    },
    setupPagination : function(page, perPage){
      var $this = $(this);
      var data = $this.data('fancygrid');
      
      data.query.pagination = { page : 0, per_page : 20 };
      if(!isNaN(Number(page)) && Number(page) >= 0){
        data.query.pagination.page = page;
      }
      if (!isNaN(Number(perPage)) && Number(perPage) > 0){
        data.query.pagination.per_page = perPage;
      }
    },
    order : function(){
      return "";
    },
    search : function(){
      var $this = $(this);
      var $content = $this.find(".js-tablewrapper");
      var $control = $this.find(".js-tablecontrol");
      var data = $this.data('fancygrid');
      data.queries += 1;
      
      $control.find(".js-reload").addClass("loading");
      $this.fadeTo(data.searchFadeTime, data.searchFadeOpac);
      
      $.ajax({
        type      : "GET",
        url       : data.url,
        data      : data.query,
        dataType  : "html",
        success   : function(result){  
          data.queries -= 1;
          if(data.queries == 0){
            $content.find(".js-row").detach();
            $content.find("table").append($(result).find(".js-row"));
            $control.find(".js-per-page").val(data.query.pagination.per_page);
            $control.find(".js-page").val(Number(data.query.pagination.page) + 1);
            
            total = (Number($(result).find(".js-page-total").text()));
            totalPages = total / data.query.pagination.per_page
            totalPages = (totalPages | 0) + 1;

            $control.find(".js-page-total").text(totalPages);
            
            $this.fadeTo(data.searchFadeTime, 1.0, function(){
              $control.find(".js-reload").removeClass("loading");
            }); 
          }
        },
        error     : function(){
          data.queries -= 1;
          if(data.queries == 0){
            $content.find(".js-row").detach();
            $this.fadeTo(data.searchFadeTime, 1.0, function(){
              $control.find(".js-reload").removeClass("loading");
            });
          }
        }
      });
    },
    nextPage : function(){
      var $this = $(this);
      data = $this.data('fancygrid');
      $this.fancygrid("setupPagination", data.query.pagination.page + 1, data.query.pagination.per_page);
      $this.fancygrid("search");
    },
    previousPage : function(){
      var $this = $(this);
      data = $this.data('fancygrid');
      $this.fancygrid("setupPagination", data.query.pagination.page - 1, data.query.pagination.per_page);
      $this.fancygrid("search");
    },
    perPage : function(perPage){
      var $this = $(this);
      data = $this.data('fancygrid');
      $this.fancygrid("setupPagination", 0, perPage);
      $this.fancygrid("search");
    },
    page : function(page){
      var $this = $(this);
      data = $this.data('fancygrid');
      $this.fancygrid("setupPagination", Number(page) - 1, data.query.pagination.per_page);
      $this.fancygrid("search");
    },
    reloadPage : function(){
      var $this = $(this);
      data = $this.data('fancygrid');
      $this.fancygrid("setupPagination", data.query.pagination.page, data.query.pagination.per_page);
      $this.fancygrid("setupConditions");
      $this.fancygrid("search");
    },
    newSearch : function(){
      var $this = $(this);
      data = $this.data('fancygrid');
      $this.fancygrid("setupPagination", 0, data.query.pagination.per_page);
      $this.fancygrid("setupConditions");
      $this.fancygrid("search");
    },
    clearSearch : function(){
      var $this = $(this);
      data = $this.data('fancygrid');
      $this.find(".js-attribute").each(function(){
        $(this).val("");
      });
      $this.fancygrid("setupPagination", 0, data.query.pagination.per_page);
      $this.fancygrid("setupConditions");
      $this.fancygrid("search");
    },
    action : function(name, value){
      $(this).trigger("action_" + name, value);
    },
    toggleSearch : function(){
      $(this).find(".js-search").toggle();
    }
  };
})(jQuery);