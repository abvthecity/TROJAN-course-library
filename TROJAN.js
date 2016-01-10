(function () {

const http = require('http')
const async = require('./async')

var TROJAN = {}

var urlparse = function(url,callback) {
	url = "http://web-app.usc.edu/web/soc/api" + url
	setTimeout(jsonparse, 150)
	function jsonparse() {
		http.get(url, function(res) {
			var body = ''
			res.on('data', function(ch) { body += ch })

			res.on('end', function() {
				try {
					var data = JSON.parse(body)
					callback(data) // IMPORTANT
				} catch(e) {
					console.error("Error: ", e)
				}
			})
		}).on('error', function(e) {
			console.error("Error: ", e)
		})
	}
}

TROJAN.term = function(callback,val) {
	val = val || {} // {curr}
	var url = "/terms"

	urlparse(url, function(data) { 
		if(!val.curr) callback(data.term) 
		else callback(data.term[data.term.length - 1])
	})
}

TROJAN.current_term = function(callback,val) {
	TROJAN.term(callback,{curr: true})
}

TROJAN.dept_raw = function(callback,val) {
	val = val || {} // {term}

	function deptCallback(term){
		var url = "/depts/" + term
		urlparse(url,function(data) {
			callback(data.department)
		})
	}

	if(val.term) deptCallback(val.term)
	else TROJAN.current_term(deptCallback)
}

TROJAN.school = function(callback,val) {
	val = val || {} // {school, data_dump, #term}

	function data_reduce(data){
		async.each(data,function(obj,cb) {
			if(school = val.school){
				if(obj['code'].toLowerCase() == school.toLowerCase()){
					callback(obj)
				}
			}
			else callback(obj['code'])
			cb()
		})
	}

	if(val.data_dump) data_reduce(val.data_dump)
	else TROJAN.dept_raw(data_reduce, { term: val.term })
}

TROJAN.dept = function(callback,val) {
	val = val || {} // {school, justcode}

	function dataGen(data_dump){
		var data = []

		async.each(data_dump,function(school_obj, cb){
			depts = school_obj.department

			function deptObjCallback(dept_obj,cbo) {
				if(!(data.indexOf(dept_obj['code']) > -1)){
					data.push(dept_obj['code'])
					if(val.justcode) callback(dept_obj['code'])
					else callback(dept_obj)
				} cbo()
			}

			if(Array.isArray(depts)) each(depts,deptObjCallback)
			else if(depts != undefined) deptObjCallback(depts)

			cb()
		})
	}

	TROJAN.dept_raw(function(data_dump) {

		if(val.school){
			TROJAN.school(function(datum) {
				dataGen([datum])
			}, {
				school: val.school, 
				data_dump: data_dump
			})
		}
		else dataGen(data_dump)

	}, {term: val.term})
}

TROJAN.dept_info = function(callback,val) {
	val = val || {} // {dept,term}

	function deptInfoCallback(dept,term,callback){
		var url = "/classes/" + dept + "/" + term
		urlparse(url,function(data) {
			callback(data.Dept_Info)
		})
	}

	if(val.dept){
		if(val.term) deptInfoCallback(val.dept,val.term,callback)
		else {
			TROJAN.current_term(function(term){
				deptInfoCallback(val.dept, term, callback)
			})
		}
	}
	else {
		function deptInfoCaller(term){
			TROJAN.dept(function(dept_code) {
				deptInfoCallback(dept_code,term,callback)
			}, {term: term, justcode: true})
		}

		if(val.term) deptInfoCaller(val.term)
		else {
			TROJAN.current_term(function(term){
				deptInfoCaller(term)
			})
		}
	}

}

TROJAN.course_raw = function(callback, val) {
	val = val || {} // {dept, term, justcode}

	function deptInfoCallback(dept,term,callback){
		var url = "/classes/" + dept + "/" + term
		urlparse(url, function(data){
			var offered = data.OfferedCourses['course']


			if(Array.isArray(offered)){
				async.each(offered,function(obj,cb){
					if(val.justcode) callback(obj.ScheduledCourseID)
					else callback(obj)

					cb()
				})
			}
			else if(offered != undefined){
				if(val.justcode) callback(offered.ScheduledCourseID)
				else callback(offered)
			}

		})
	}

	if(val.dept){
		if(val.term) deptInfoCallback(val.dept,val.term,callback)
		else {
			TROJAN.current_term(function(term){
				deptInfoCallback(val.dept, term, callback)
			})
		}
	}
	else {
		if(val.justcode){
			function rapidLoop(term){
				TROJAN.dept(function(depts){
					deptInfoCallback(depts,term,callback)
				},{justcode:true})
			}

			if(val.term) rapidLoop(val.term)
			else TROJAN.current_term(rapidLoop)
		}
		else console.error("Please at LEAST include {justcode:true}")
	}
}

TROJAN.course = function(callback,val) {
	val = val || {} // {course, term}

	function courseCall(dept,classid,seq,term,callback){
		TROJAN.course_raw(function(data_dump){
			if(data_dump.ScheduledCourseID == dept+'-'+classid+seq
				|| (data_dump.CourseData['prefix'] == dept 
					&& data_dump.CourseData['number'] == classid)){
				callback(data_dump.CourseData)
			}
		},{dept: dept, term: term})
	}

	if(val.course){
		val.course = val.course.toUpperCase()
		var courseid = val.course.split("-")
		if(courseid[1].length > 3){
			courseid[2] = courseid[1].substring(3)
			courseid[1] = courseid[1].substring(0, 3)
		}

		if(!(courseid.length == 2 || courseid.length == 3) 
			|| !isNaN(courseid[0]) || isNaN(courseid[1])) {
			console.error("courseid format incorrect")
		}
		else {
			if(val.term)
				courseCall(courseid[0],courseid[1],courseid[2],val.term,callback)
			else {
				TROJAN.current_term(function(term){
					courseCall(courseid[0],courseid[1],courseid[2],term,callback)
				})
			}
		}
	} else {
		console.error("Need a course")
	}
}

TROJAN.sect = function(callback,val) {
	val = val || {} // {course, term, sect}

	TROJAN.course(function(data_dump){

		if(val.sect){
			val.sect = val.sect.substring(0,5)
			if(data_dump.SectionData['id'] == sect){
				callback(data_dump.SectionData)
			}
		}
		else {
			async.each(data_dump.SectionData,function(obj,cb){
				callback(obj)
			})
		}

	}, {
		course: val.course, 
		term: val.term
	})

}

// Node.js
if (typeof module === 'object' && module.exports) {
	module.exports = TROJAN
}
// AMD / RequireJS
else if (typeof define === 'function' && define.amd) {
	define([], function () {
	    return TROJAN
	});
}
// included directly via <script> tag
else {
	root.TROJAN = TROJAN
}

}());