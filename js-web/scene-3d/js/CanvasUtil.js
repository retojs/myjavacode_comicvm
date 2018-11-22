function drawDot(ctx, point2D, size) {
    ctx.beginPath();
    ctx.arc(point2D.x, point2D.y, size, 0, 2 * Math.PI);
    ctx.fill();
}

function drawCircle(ctx, point2D, size) {
    ctx.beginPath();
    ctx.arc(point2D.x, point2D.y, size, 0, 2 * Math.PI);
    ctx.stroke();
}

function drawLine(ctx, fromX, fromY, toX, toY) {
	ctx.beginPath();
	ctx.moveTo(fromX, fromY);
	ctx.lineTo(toX, toY);
	ctx.closePath();
	ctx.stroke();
}

function clipRect(canvasCtx, rectangle) {
	canvasCtx.restore();
	canvasCtx.beginPath();
	canvasCtx.moveTo(rectangle.x, 
					 rectangle.y);
	canvasCtx.lineTo(rectangle.x + rectangle.w, 
					 rectangle.y);
	canvasCtx.lineTo(rectangle.x + rectangle.w, 
					 rectangle.y + rectangle.h);
	canvasCtx.lineTo(rectangle.x, 
			 		 rectangle.y + rectangle.h);
	canvasCtx.clip();
}