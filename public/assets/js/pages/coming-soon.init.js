

document.addEventListener('DOMContentLoaded', function () {

    var countDownDate = new Date("Jan 1, 2022").getTime();

    var countDown = setInterval(function () {

        var currentTime = new Date().getTime();

        var distance = countDownDate - currentTime;

        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        var countDownBlock = '<div class="countdownlist-item">'+
                                '<div class="count-title">Days</div>'+'<div class="count-num">'+ days +'</div>'+
                            '</div>'+
                            '<div class="countdownlist-item">'+
                                '<div class="count-title">Hours</div>'+'<div class="count-num">'+ hours +'</div>'+
                            '</div>'+
                            '<div class="countdownlist-item">'+
                                '<div class="count-title">Minutes</div>'+'<div class="count-num">'+ minutes +'</div>'+
                            '</div>'+
                            '<div class="countdownlist-item">'+
                                '<div class="count-title">Seconds</div>'+'<div class="count-num">'+ seconds +'</div>'+
                            '</div>';

        // Output the result in an element with id="countDownBlock"
        document.getElementById("countdown").innerHTML = countDownBlock;

        // If the count down is over, write some text 
        if (distance < 0) {
            clearInterval(countDown);
            document.getElementById("countdown").innerHTML = '<div class="countdown-endtxt">The countdown has ended!</div>';
        }
    }, 1000);

});

