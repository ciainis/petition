if ($("#canvas")[0]) {
    var context = $("#canvas")[0].getContext("2d");
    context.strokeStyle = "black";
    context.lineWidth = 2;

    let isSigning = false;
    let lastX = 0;
    let lastY = 0;

    $("#canvas").on("mousedown", e => {
        isSigning = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });

    $("#canvas").on("mousemove", sign);

    $("#canvas").on("mouseup", () => {
        var signature = $("#canvas")[0].toDataURL();
        isSigning = false;
        $("#input-sign").attr("value", signature);
    });

    $("#canvas").on("mouseout", () => (isSigning = false));

    function sign(e) {
        if (!isSigning) return;
        context.beginPath();
        context.moveTo(lastX, lastY);
        context.lineTo(e.offsetX, e.offsetY);
        context.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }
}
