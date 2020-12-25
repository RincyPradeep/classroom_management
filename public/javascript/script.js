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


function viewAttendance(event){
    let currentDate = document.getElementById("mydate").value;   
    let formDate = formatDate (currentDate);
      alert("Formatted date: "+ formDate);
      
    $.ajax({
        url:'/tutor/attendance/view_attendance',
        data:{
            date:formDate
        },
        method:'post',
        success:(response)=>{
            $("#rollno").html(response.rollno)
            $("#name").html(response.name)
            $("#status").html(response.status)
            alert("success");
        }
    })
}
function formatDate(dateString)
    {
        alert("**********"+ dateString);
        var allDate = dateString.split(' ');
        var thisDate = allDate[0].split('-');
        
        var newDate = [thisDate[2],thisDate[1],thisDate[0] ].join("/");
        alert("New date"+ newDate);
        
        return newDate;
    }