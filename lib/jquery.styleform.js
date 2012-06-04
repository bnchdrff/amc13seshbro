/*
Plugin: Styleform 0.7.47
Author: Manuel Bieh
URL: http://www.manuel-bieh.de/
*/

(function($){

 	$.fn.extend({ 
 		
 		styleForm: function() {

			var styleforms = $(this);

			function assignClasses() {

				$('input:radio:not(:checked)', styleforms).next().removeClass('rchecked');
				$('input:radio:checked', styleforms).next().addClass('rchecked');

				$('input:checkbox:checked', styleforms).next().addClass('cchecked');
				$('input:checkbox:not(:checked)', styleforms).next().removeClass('cchecked');

				$('input:disabled', styleforms).next().addClass('disabled');
				$('input:not(:disabled)', styleforms).next().removeClass('disabled');

			}

			$('input:radio', $(this)).each(function() {

				if(!$(this).next().hasClass('styleRadio')) {
					$(this).after('<span class="styleRadio"></span>');
				}
				$(this).hide();

			});

			$('input:checkbox', $(this)).each(function() {

				if(!$(this).next().hasClass('styleCheckbox')) {
					$(this).after('<span class="styleCheckbox"></span>');
				}
				$(this).hide();

			});

			$('.styleRadio, .styleCheckbox', $(this)).unbind('click').bind('click', function() {

				$(this).prev('input')[0].click();
				assignClasses();

			});

			$('label', $(this)).each(function() {

				$(this).unbind('click').bind('click', function(e) {

					e.preventDefault();
					el = $('#' + $(this).attr('for'));
					el[0].click();
					assignClasses();

				});

			});

			assignClasses();

    	}

	});
		
})(jQuery);

