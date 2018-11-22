function initConfig() {
	$('#TEST_OBJ_IMG_SIZE').val(TEST_OBJ_IMG_SIZE);
	$('#TEST_OBJ_SIT_X').val(TEST_OBJ_SIT_X);
	$('#TEST_OBJ_SIT_Y').val(TEST_OBJ_SIT_Y);
	
	$('#TEST_OBJ_X').val(TEST_OBJ_X);
	$('#TEST_OBJ_Y').val(TEST_OBJ_Y);
	$('#TEST_OBJ_Z').val(TEST_OBJ_Z);

	$('#TEST_BGR_FLUCHT_X').val(TEST_BGR_FLUCHT_X);
	$('#TEST_BGR_FLUCHT_Y').val(TEST_BGR_FLUCHT_Y);

	$('#TEST_PANEL_FLUCHT_X').val(TEST_PANEL_FLUCHT_X);
	$('#TEST_PANEL_FLUCHT_Y').val(TEST_PANEL_FLUCHT_Y);

	$('#TEST_BGR_UNIT_SIZE').val(TEST_BGR_UNIT_SIZE);
	$('#TEST_BGR_UNIT_Y').val(TEST_BGR_UNIT_Y);

	$('#TEST_PANEL_UNIT_SIZE').val(TEST_PANEL_UNIT_SIZE);
	$('#TEST_PANEL_UNIT_X').val(TEST_PANEL_UNIT_X);
}

function configureExample(){
	DEBUG_PANEL = $('#DEBUG_PANEL').prop('checked');
	DEBUG_HORIZON = $('#DEBUG_HORIZON').prop('checked');
	DEBUG_PERSPECTIVE = $('#DEBUG_PERSPECTIVE').prop('checked');
	DEBUG_BGR_UNIT = $('#DEBUG_BGR_UNIT').prop('checked');
	DEBUG_OBJ_UNIT = $('#DEBUG_OBJ_UNIT').prop('checked');
	DEBUG_IMAGE = $('#DEBUG_IMAGE').prop('checked');
	
	TEST_OBJ_IMG_SIZE = eval($('#TEST_OBJ_IMG_SIZE').val());
	TEST_OBJ_SIT_X = eval($('#TEST_OBJ_SIT_X').val());
	TEST_OBJ_SIT_Y = eval($('#TEST_OBJ_SIT_Y').val());
	
	TEST_OBJ_X = eval($('#TEST_OBJ_X').val());
	TEST_OBJ_Y = eval($('#TEST_OBJ_Y').val());
	TEST_OBJ_Z = eval($('#TEST_OBJ_Z').val());

	TEST_BGR_FLUCHT_X = eval($('#TEST_BGR_FLUCHT_X').val());
	TEST_BGR_FLUCHT_Y = eval($('#TEST_BGR_FLUCHT_Y').val());

	TEST_PANEL_FLUCHT_X = eval($('#TEST_PANEL_FLUCHT_X').val());
	TEST_PANEL_FLUCHT_Y = eval($('#TEST_PANEL_FLUCHT_Y').val());

	TEST_BGR_UNIT_SIZE = eval($('#TEST_BGR_UNIT_SIZE').val());
	TEST_BGR_UNIT_Y = eval($('#TEST_BGR_UNIT_Y').val());

	TEST_PANEL_UNIT_SIZE = eval($('#TEST_PANEL_UNIT_SIZE').val());
	TEST_PANEL_UNIT_X = eval($('#TEST_PANEL_UNIT_X').val());

	//alert("TEST_OBJ_SIT_Y " + eval($('#TEST_OBJ_SIT_Y').val()));
}

