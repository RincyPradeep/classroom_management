function submitAssignment(assignmentId){
    
    $.ajax({
        url:'/assignments/submit_assignment/'+assignmentId,
        method:'get',
        success:(response)=>{
            $("#topic").val(response.topic)
            $("#assignmentId").val(response.assignmentId)
            $('#topic').prop( "disabled", false );
            $('#myfile').prop( "disabled", false );
            $('#submitbtn').prop( "disabled", false );
        }
    })
}
