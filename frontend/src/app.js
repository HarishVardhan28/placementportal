const API_URL = 'http://localhost:5000/api';

const LoginComponent = {
    template: `
        <div class="row justify-content-center" style="margin-top: 3rem;">
            <div class="col-md-5">
                <div class="card">
                    <div class="card-header" style="background: #0066cc; color: white; text-align: center; padding: 1.5rem;">
                        <h4 style="margin: 0; color: white;">Placement Portal</h4>
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: white;">Login to your account</p>
                    </div>
                    <div class="card-body">
                        <form @submit.prevent="login">
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" v-model="email" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" v-model="password" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Login</button>
                            <div class="text-center mt-3">
                                <span class="text-muted">New user?</span>
                                <button type="button" class="btn btn-link" @click="$emit('change-view', 'register')">Register here</button>
                            </div>
                        </form>
                        <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            email: '',
            password: '',
            error: ''
        };
    },
    methods: {
        async login() {
            try {
                const response = await axios.post(`${API_URL}/auth/login`, {
                    email: this.email,
                    password: this.password
                });
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('role', response.data.role);
                this.$emit('login-success', response.data.role);
            } catch (err) {
                this.error = err.response?.data?.error || 'Login failed';
            }
        }
    }
};

const RegisterComponent = {
    template: `
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h4 style="margin: 0;">Register New Account</h4>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Register as</label>
                            <select class="form-select" v-model="userType">
                                <option value="student">Student</option>
                                <option value="company">Company</option>
                            </select>
                        </div>

                        <form @submit.prevent="register" v-if="userType === 'student'">
                            <div class="mb-3">
                                <label class="form-label">Full Name</label>
                                <input type="text" class="form-control" v-model="formData.full_name" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Roll Number</label>
                                <input type="text" class="form-control" v-model="formData.roll_number" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" v-model="formData.email" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" v-model="formData.password" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Branch</label>
                                <input type="text" class="form-control" v-model="formData.branch" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">CGPA</label>
                                <input type="number" step="0.01" class="form-control" v-model="formData.cgpa" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Year</label>
                                <input type="number" class="form-control" v-model="formData.year" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Phone</label>
                                <input type="text" class="form-control" v-model="formData.phone">
                            </div>
                            <button type="submit" class="btn btn-primary">Register</button>
                            <button type="button" class="btn btn-link" @click="$emit('change-view', 'login')">Back to Login</button>
                        </form>

                        <form @submit.prevent="register" v-if="userType === 'company'">
                            <div class="mb-3">
                                <label class="form-label">Company Name</label>
                                <input type="text" class="form-control" v-model="formData.company_name" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">HR Name</label>
                                <input type="text" class="form-control" v-model="formData.hr_name" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">HR Contact</label>
                                <input type="text" class="form-control" v-model="formData.hr_contact" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" v-model="formData.email" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" v-model="formData.password" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Website</label>
                                <input type="text" class="form-control" v-model="formData.website">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" v-model="formData.description"></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">Register</button>
                            <button type="button" class="btn btn-link" @click="$emit('change-view', 'login')">Back to Login</button>
                        </form>

                        <div v-if="message" class="alert alert-success mt-3">{{ message }}</div>
                        <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            userType: 'student',
            formData: {},
            message: '',
            error: ''
        };
    },
    methods: {
        async register() {
            try {
                const endpoint = this.userType === 'student' ? 'student' : 'company';
                await axios.post(`${API_URL}/auth/register/${endpoint}`, this.formData);
                this.message = 'Registration successful! Please login.';
                this.formData = {};
                setTimeout(() => this.$emit('change-view', 'login'), 2000);
            } catch (err) {
                this.error = err.response?.data?.error || 'Registration failed';
            }
        }
    }
};

const AdminDashboard = {
    template: `
        <div>
            <h2>Admin Dashboard</h2>
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card text-white bg-primary">
                        <div class="card-body">
                            <h5>Total Students</h5>
                            <h2>{{ stats.total_students }}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card text-white bg-success">
                        <div class="card-body">
                            <h5>Total Companies</h5>
                            <h2>{{ stats.total_companies }}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card text-white bg-info">
                        <div class="card-body">
                            <h5>Total Drives</h5>
                            <h2>{{ stats.total_drives }}</h2>
                        </div>
                    </div>
                </div>
            </div>

            <ul class="nav nav-tabs mb-3">
                <li class="nav-item">
                    <a class="nav-link" :class="{active: activeTab === 'companies'}" @click="activeTab = 'companies'">Companies</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" :class="{active: activeTab === 'students'}" @click="activeTab = 'students'">Students</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" :class="{active: activeTab === 'drives'}" @click="activeTab = 'drives'">Drives</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" :class="{active: activeTab === 'interviews'}" @click="activeTab = 'interviews'">Interview Requests</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" :class="{active: activeTab === 'allInterviews'}" @click="activeTab = 'allInterviews'">All Interviews</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" :class="{active: activeTab === 'reports'}" @click="activeTab = 'reports'">Reports</a>
                </li>
            </ul>

            <div v-if="activeTab === 'companies'">
                <input type="text" class="form-control mb-3" v-model="searchQuery" @input="loadCompanies" placeholder="Search companies...">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Company Name</th>
                            <th>HR Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="company in companies" :key="company.id">
                            <td>{{ company.company_name }}</td>
                            <td>{{ company.hr_name }}</td>
                            <td>{{ company.email }}</td>
                            <td>{{ company.approval_status }}</td>
                            <td>
                                <button class="btn btn-sm btn-success" @click="approveCompany(company.id)" v-if="company.approval_status === 'pending'">Approve</button>
                                <button class="btn btn-sm btn-danger" @click="rejectCompany(company.id)" v-if="company.approval_status === 'pending'">Reject</button>
                                <button class="btn btn-sm btn-warning" @click="toggleCompany(company.id)">{{ company.is_active ? 'Deactivate' : 'Activate' }}</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="activeTab === 'students'">
                <input type="text" class="form-control mb-3" v-model="searchQuery" @input="loadStudents" placeholder="Search students...">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Roll Number</th>
                            <th>Branch</th>
                            <th>CGPA</th>
                            <th>Email</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="student in students" :key="student.id">
                            <td>{{ student.full_name }}</td>
                            <td>{{ student.roll_number }}</td>
                            <td>{{ student.branch }}</td>
                            <td>{{ student.cgpa }}</td>
                            <td>{{ student.email }}</td>
                            <td>
                                <button class="btn btn-sm btn-warning me-1" @click="toggleStudent(student.id)">{{ student.is_active ? 'Deactivate' : 'Activate' }}</button>
                                <a v-if="student.resume_filename" :href="'http://localhost:5000/api/student/resume/download/' + student.id" class="btn btn-sm btn-info" target="_blank">Resume</a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="activeTab === 'drives'">
                <input type="text" class="form-control mb-3" v-model="driveSearch" @input="loadDrives" placeholder="Search drives by title or company...">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Job Title</th>
                            <th>Company</th>
                            <th>Deadline</th>
                            <th>Status</th>
                            <th>Applicants</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="drive in drives" :key="drive.id">
                            <tr>
                                <td>{{ drive.job_title }}</td>
                                <td>{{ drive.company_name }}</td>
                                <td>{{ new Date(drive.application_deadline).toLocaleDateString() }}</td>
                                <td>{{ drive.status }}</td>
                                <td>{{ drive.applicants }}</td>
                                <td>
                                    <button class="btn btn-sm btn-success me-1" @click="approveDrive(drive.id)" v-if="drive.status === 'pending'">Approve</button>
                                    <button class="btn btn-sm btn-danger me-1" @click="rejectDrive(drive.id)" v-if="drive.status === 'pending'">Reject</button>
                                    <button class="btn btn-sm btn-warning me-1" @click="deactivateDrive(drive.id)" v-if="drive.status === 'approved'">Deactivate</button>
                                    <button class="btn btn-sm btn-info" @click="viewDriveApplications(drive.id)">{{ selectedDriveId === drive.id ? 'Hide' : 'View' }} Applicants</button>
                                </td>
                            </tr>
                            <tr v-if="selectedDriveId === drive.id && driveApplications.length > 0">
                                <td colspan="6">
                                    <div class="p-3 bg-light">
                                        <h6>Applicants for {{ drive.job_title }}</h6>
                                        <table class="table table-sm table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Student Name</th>
                                                    <th>Roll Number</th>
                                                    <th>Branch</th>
                                                    <th>CGPA</th>
                                                    <th>Status</th>
                                                    <th>Final Result</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="app in driveApplications" :key="app.id">
                                                    <td>{{ app.student_name }}</td>
                                                    <td>{{ app.roll_number }}</td>
                                                    <td>{{ app.branch }}</td>
                                                    <td>{{ app.cgpa }}</td>
                                                    <td><span class="badge bg-info">{{ app.status }}</span></td>
                                                    <td><span v-if="app.final_result" class="badge bg-success">{{ app.final_result }}</span></td>
                                                    <td>
                                                        <button class="btn btn-sm btn-success" @click="showFinalResult(app)">Final Result</button>
                                                        <a v-if="app.resume_filename" :href="'http://localhost:5000/api/student/resume/download/' + app.student_id" class="btn btn-sm btn-info ms-1" target="_blank">Resume</a>
                                                        <div v-if="app.interviews && app.interviews.length > 0" class="mt-2">
                                                            <small class="text-muted">Interviews:</small>
                                                            <div v-for="interview in app.interviews" :key="interview.id" :class="interview.status === 'approved' ? 'badge bg-success me-1' : 'badge bg-secondary me-1'">
                                                                {{ new Date(interview.interview_date).toLocaleString() }} - {{ interview.interview_mode }}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="selectedDriveId === drive.id && driveApplications.length === 0">
                                <td colspan="6" class="text-center text-muted p-3">
                                    No applicants yet
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>

            <div v-if="activeTab === 'allInterviews'">
                <h4>All Scheduled Interviews</h4>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Roll No</th>
                            <th>Company</th>
                            <th>Job Title</th>
                            <th>Interview Date</th>
                            <th>Mode</th>
                            <th>Status</th>
                            <th>App Status</th>
                            <th>Final Result</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="interview in allInterviews" :key="interview.id">
                            <tr>
                                <td>{{ interview.student_name }}</td>
                                <td>{{ interview.student_roll }}</td>
                                <td>{{ interview.company_name }}</td>
                                <td>{{ interview.job_title }}</td>
                                <td>{{ new Date(interview.interview_date).toLocaleString() }}</td>
                                <td>{{ interview.interview_mode }}</td>
                                <td>
                                    <span class="badge" :class="{
                                        'bg-warning': interview.status === 'pending',
                                        'bg-success': interview.status === 'approved',
                                        'bg-danger': interview.status === 'rejected'
                                    }">{{ interview.status }}</span>
                                </td>
                                <td><span class="badge bg-info">{{ interview.application_status }}</span></td>
                                <td>
                                    <span v-if="interview.final_result" class="badge" :class="{
                                        'bg-success': interview.final_result === 'selected',
                                        'bg-danger': interview.final_result === 'rejected'
                                    }">{{ interview.final_result }}</span>
                                    <span v-else class="text-muted">-</span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-info" @click="toggleInterviewDetails(interview.id)">
                                        {{ selectedInterviewId === interview.id ? 'Hide' : 'View' }} Details
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="selectedInterviewId === interview.id">
                                <td colspan="10">
                                    <div class="p-3 bg-light">
                                        <div class="row mb-2">
                                            <div class="col-md-6"><strong>Location:</strong> {{ interview.location || 'N/A' }}</div>
                                            <div class="col-md-6"><strong>Notes:</strong> {{ interview.notes || 'N/A' }}</div>
                                        </div>
                                        <div v-if="interview.rounds && interview.rounds.length > 0" class="mt-3">
                                            <h6>Interview Rounds</h6>
                                            <table class="table table-sm table-bordered">
                                                <thead>
                                                    <tr>
                                                        <th>Round #</th>
                                                        <th>Round Name</th>
                                                        <th>Date</th>
                                                        <th>Result</th>
                                                        <th>Feedback</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="round in interview.rounds" :key="round.id">
                                                        <td>{{ round.round_number }}</td>
                                                        <td>{{ round.round_name }}</td>
                                                        <td>{{ round.round_date ? new Date(round.round_date).toLocaleString() : 'TBD' }}</td>
                                                        <td>
                                                            <span class="badge" :class="{
                                                                'bg-warning': round.result === 'pending',
                                                                'bg-success': round.result === 'passed',
                                                                'bg-danger': round.result === 'rejected'
                                                            }">{{ round.result }}</span>
                                                        </td>
                                                        <td>{{ round.feedback || '-' }}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div v-else class="text-muted mt-2">
                                            <em>No rounds scheduled yet</em>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>

            <div v-if="activeTab === 'interviews'">
                <h4>Pending Interview Requests</h4>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Company</th>
                            <th>Job Title</th>
                            <th>Interview Date</th>
                            <th>Mode</th>
                            <th>Location</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="interview in pendingInterviews" :key="interview.id">
                            <td>{{ interview.student_name }}</td>
                            <td>{{ interview.company_name }}</td>
                            <td>{{ interview.job_title }}</td>
                            <td>{{ new Date(interview.interview_date).toLocaleString() }}</td>
                            <td>{{ interview.interview_mode }}</td>
                            <td>{{ interview.location }}</td>
                            <td>
                                <button class="btn btn-sm btn-success me-1" @click="approveInterview(interview.id)">Approve</button>
                                <button class="btn btn-sm btn-danger" @click="rejectInterview(interview.id)">Reject</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="activeTab === 'reports'">
                <h4>Placement Statistics & Reports</h4>

                <div class="card mb-4" style="border: 2px solid #0066cc;">
                    <div class="card-header" style="background: #0066cc; color: white;">
                        <h5 style="margin: 0; color: white;">Background Job Processing (Celery + Redis)</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3 mb-3">
                            <div class="col-md-4">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h6>Placement Report</h6>
                                        <p class="text-muted" style="font-size:0.85rem;">Generate comprehensive stats asynchronously (~3s)</p>
                                        <button class="btn btn-success w-100" @click="triggerReportGeneration" :disabled="taskRunning">Generate Report</button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h6>Daily Reminders</h6>
                                        <p class="text-muted" style="font-size:0.85rem;">Send deadline reminders via Google Chat webhook</p>
                                        <button class="btn btn-primary w-100" @click="triggerDailyReminders" :disabled="taskRunning">Send Reminders</button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h6>Monthly Report</h6>
                                        <p class="text-muted" style="font-size:0.85rem;">Generate last 30 days placement summary</p>
                                        <button class="btn btn-warning w-100" @click="triggerMonthlyReport" :disabled="taskRunning">Generate Monthly</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-if="taskStatus && taskStatus.loading" class="alert alert-info mt-2 d-flex align-items-center gap-2">
                            <div class="spinner-border spinner-border-sm" role="status"></div>
                            <span>{{ taskStatus.title }} — running in background via Celery...</span>
                        </div>

                        <div v-if="taskStatus && !taskStatus.loading && taskStatus.type === 'alert-danger'" class="alert alert-danger mt-2">
                            <strong>{{ taskStatus.title }}</strong> — {{ taskStatus.message }}
                        </div>

                        <div v-if="taskStatus && !taskStatus.loading && taskStatus.type === 'alert-success' && taskStatus.plainResult" class="alert alert-success mt-2">
                            <strong>{{ taskStatus.title }}</strong><br>
                            <span>{{ taskStatus.plainResult }}</span>
                        </div>

                        <div v-if="taskStatus && !taskStatus.loading && taskStatus.reportResult" class="mt-3">
                            <div class="alert alert-success mb-3"><strong>{{ taskStatus.title }}</strong> — Generated at {{ new Date(taskStatus.reportResult.timestamp).toLocaleString() }}</div>
                            <div class="row g-3 mb-2">
                                <div class="col-6 col-md-3">
                                    <div class="card text-white bg-primary h-100">
                                        <div class="card-body text-center">
                                            <div style="font-size:2rem;font-weight:700;">{{ taskStatus.reportResult.total_students }}</div>
                                            <div style="font-size:0.85rem;">Total Students</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="card text-white bg-info h-100">
                                        <div class="card-body text-center">
                                            <div style="font-size:2rem;font-weight:700;">{{ taskStatus.reportResult.total_companies }}</div>
                                            <div style="font-size:0.85rem;">Active Companies</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="card text-white bg-warning h-100">
                                        <div class="card-body text-center">
                                            <div style="font-size:2rem;font-weight:700;">{{ taskStatus.reportResult.total_drives }}</div>
                                            <div style="font-size:0.85rem;">Approved Drives</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="card text-white bg-success h-100">
                                        <div class="card-body text-center">
                                            <div style="font-size:2rem;font-weight:700;">{{ taskStatus.reportResult.total_applications }}</div>
                                            <div style="font-size:0.85rem;">Total Applications</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row g-3">
                                <div class="col-6 col-md-4">
                                    <div class="card h-100" style="border:2px solid #28a745;">
                                        <div class="card-body text-center">
                                            <div style="font-size:1.8rem;font-weight:700;color:#28a745;">{{ taskStatus.reportResult.selected_students }}</div>
                                            <div style="font-size:0.85rem;">Students Selected</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 col-md-4">
                                    <div class="card h-100" style="border:2px solid #ffc107;">
                                        <div class="card-body text-center">
                                            <div style="font-size:1.8rem;font-weight:700;color:#ffc107;">{{ taskStatus.reportResult.shortlisted_students }}</div>
                                            <div style="font-size:0.85rem;">Shortlisted</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6 col-md-4">
                                    <div class="card h-100" style="border:2px solid #0066cc;">
                                        <div class="card-body text-center">
                                            <div style="font-size:1.8rem;font-weight:700;color:#0066cc;">{{ taskStatus.reportResult.placement_rate }}</div>
                                            <div style="font-size:0.85rem;">Placement Rate</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card mb-4">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 style="margin:0;">Redis Cache Statistics</h5>
                        <div>
                            <button class="btn btn-sm btn-info me-2" @click="loadCacheStats">Refresh Stats</button>
                            <button class="btn btn-sm btn-danger" @click="clearCache">Clear Cache</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div v-if="cacheStats" class="row g-3">
                            <div class="col-md-3">
                                <div class="card h-100" style="background:#17a2b8;">
                                    <div class="card-body text-center">
                                        <h6 style="color:#fff;font-size:0.85rem;">Memory Used</h6>
                                        <h4 style="color:#fff;font-weight:700;">{{ cacheStats.used_memory }}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card h-100" style="background:#0066cc;">
                                    <div class="card-body text-center">
                                        <h6 style="color:#fff;font-size:0.85rem;">Total Keys</h6>
                                        <h4 style="color:#fff;font-weight:700;">{{ cacheStats.total_keys }}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card h-100" style="background:#28a745;">
                                    <div class="card-body text-center">
                                        <h6 style="color:#fff;font-size:0.85rem;">Cache Hits</h6>
                                        <h4 style="color:#fff;font-weight:700;">{{ cacheStats.hits }}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card h-100" style="background:#e67e22;">
                                    <div class="card-body text-center">
                                        <h6 style="color:#fff;font-size:0.85rem;">Cache Misses</h6>
                                        <h4 style="color:#fff;font-weight:700;">{{ cacheStats.misses }}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p v-else class="text-muted">Click "Refresh Stats" to load cache statistics</p>
                    </div>
                </div>
                
                <div class="row mb-4">
                    <div class="col-md-3"><div class="card text-white bg-success"><div class="card-body"><h6>Total Applications</h6><h3>{{ reportStats.overview?.total_applications || 0 }}</h3></div></div></div>
                    <div class="col-md-3"><div class="card text-white bg-info"><div class="card-body"><h6>Students Placed</h6><h3>{{ reportStats.application_status?.selected || 0 }}</h3></div></div></div>
                    <div class="col-md-3"><div class="card text-white bg-warning"><div class="card-body"><h6>Shortlisted</h6><h3>{{ reportStats.application_status?.shortlisted || 0 }}</h3></div></div></div>
                    <div class="col-md-3"><div class="card text-white bg-primary"><div class="card-body"><h6>Approved Drives</h6><h3>{{ reportStats.overview?.approved_drives || 0 }}</h3></div></div></div>
                </div>
                <div class="row mb-4">
                    <div class="col-md-6"><div class="card"><div class="card-header"><h5>Application Status Distribution</h5></div><div class="card-body"><canvas id="statusChart"></canvas></div></div></div>
                    <div class="col-md-6"><div class="card"><div class="card-header"><h5>Branch-wise Placements</h5></div><div class="card-body"><canvas id="branchChart"></canvas></div></div></div>
                </div>
                <div class="row mb-4">
                    <div class="col-md-6"><div class="card"><div class="card-header"><h5>Branch-wise Statistics</h5></div><div class="card-body"><table class="table table-striped"><thead><tr><th>Branch</th><th>Applications</th><th>Placements</th><th>Success Rate</th></tr></thead><tbody><tr v-for="branch in reportStats.branch_statistics" :key="branch.branch"><td>{{ branch.branch }}</td><td>{{ branch.applications }}</td><td>{{ branch.placements }}</td><td>{{ branch.applications > 0 ? ((branch.placements / branch.applications) * 100).toFixed(1) : 0 }}%</td></tr></tbody></table></div></div></div>
                    <div class="col-md-6"><div class="card"><div class="card-header"><h5>Top Companies</h5></div><div class="card-body"><canvas id="companyChart"></canvas></div></div></div>
                </div>
            </div>

            <div v-if="showResultModal" class="modal d-block" style="background: rgba(0,0,0,0.5)">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Update Final Result</h5>
                            <button type="button" class="btn-close" @click="showResultModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Student: {{ selectedApp?.student_name }}</label>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Final Result</label>
                                <select class="form-select" v-model="finalResult" required>
                                    <option value="selected">Selected</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="on-hold">On Hold</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showResultModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="updateFinalResult">Update</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            stats: {},
            activeTab: 'companies',
            companies: [],
            students: [],
            drives: [],
            searchQuery: '',
            driveSearch: '',
            selectedDriveId: null,
            driveApplications: [],
            reportStats: {},
            charts: {},
            showResultModal: false,
            selectedApp: null,
            finalResult: '',
            pendingInterviews: [],
            allInterviews: [],
            selectedInterviewId: null,
            taskRunning: false,
            taskStatus: null,
            cacheStats: null
        };
    },
    computed: {
        authToken() {
            return localStorage.getItem('token');
        }
    },
    mounted() {
        this.loadStats();
        this.loadCompanies();
    },
    methods: {
        async loadStats() {
            const response = await axios.get(`${API_URL}/admin/dashboard`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.stats = response.data;
        },
        async loadCompanies() {
            const response = await axios.get(`${API_URL}/admin/companies?search=${this.searchQuery}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.companies = response.data;
        },
        async loadStudents() {
            const response = await axios.get(`${API_URL}/admin/students?search=${this.searchQuery}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.students = response.data;
        },
        async loadDrives() {
            const response = await axios.get(`${API_URL}/admin/drives?search=${this.driveSearch || ''}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.drives = response.data;
        },
        async approveCompany(id) {
            await axios.put(`${API_URL}/admin/companies/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.loadCompanies();
        },
        async rejectCompany(id) {
            await axios.put(`${API_URL}/admin/companies/${id}/reject`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.loadCompanies();
        },
        async toggleCompany(id) {
            await axios.put(`${API_URL}/admin/companies/${id}/toggle`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.loadCompanies();
        },
        async toggleStudent(id) {
            await axios.put(`${API_URL}/admin/students/${id}/toggle`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.loadStudents();
        },
        async approveDrive(id) {
            await axios.put(`${API_URL}/admin/drives/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.loadDrives();
        },
        async rejectDrive(id) {
            await axios.put(`${API_URL}/admin/drives/${id}/reject`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.loadDrives();
        },
        async deactivateDrive(id) {
            if (confirm('Are you sure you want to deactivate this drive?')) {
                await axios.put(`${API_URL}/admin/drives/${id}/deactivate`, {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                alert('Drive deactivated successfully');
                this.loadDrives();
            }
        },
        async viewDriveApplications(driveId) {
            if (this.selectedDriveId === driveId) {
                this.selectedDriveId = null;
                this.driveApplications = [];
            } else {
                this.selectedDriveId = driveId;
                const response = await axios.get(`${API_URL}/admin/drives/${driveId}/applications`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                this.driveApplications = response.data;
            }
        },
        async loadReports() {
            const response = await axios.get(`${API_URL}/admin/reports/statistics`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.reportStats = response.data;
            this.$nextTick(() => {
                this.renderCharts();
            });
        },
        renderCharts() {
            if (this.charts.statusChart) this.charts.statusChart.destroy();
            if (this.charts.branchChart) this.charts.branchChart.destroy();
            if (this.charts.companyChart) this.charts.companyChart.destroy();
            
            const statusCtx = document.getElementById('statusChart');
            if (statusCtx) {
                this.charts.statusChart = new Chart(statusCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Applied', 'Shortlisted', 'Selected', 'Rejected'],
                        datasets: [{
                            data: [
                                this.reportStats.application_status?.applied || 0,
                                this.reportStats.application_status?.shortlisted || 0,
                                this.reportStats.application_status?.selected || 0,
                                this.reportStats.application_status?.rejected || 0
                            ],
                            backgroundColor: ['#0dcaf0', '#ffc107', '#198754', '#dc3545']
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: true }
                });
            }
            
            const branchCtx = document.getElementById('branchChart');
            if (branchCtx && this.reportStats.branch_statistics) {
                this.charts.branchChart = new Chart(branchCtx, {
                    type: 'bar',
                    data: {
                        labels: this.reportStats.branch_statistics.map(b => b.branch),
                        datasets: [{
                            label: 'Applications',
                            data: this.reportStats.branch_statistics.map(b => b.applications),
                            backgroundColor: '#0d6efd'
                        }, {
                            label: 'Placements',
                            data: this.reportStats.branch_statistics.map(b => b.placements),
                            backgroundColor: '#198754'
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: true }
                });
            }
            
            const companyCtx = document.getElementById('companyChart');
            if (companyCtx && this.reportStats.top_companies) {
                this.charts.companyChart = new Chart(companyCtx, {
                    type: 'bar',
                    data: {
                        labels: this.reportStats.top_companies.map(c => c.company_name),
                        datasets: [{
                            label: 'Applications',
                            data: this.reportStats.top_companies.map(c => c.applications),
                            backgroundColor: '#0d6efd'
                        }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: true,
                        indexAxis: 'y'
                    }
                });
            }
        },
        showFinalResult(app) {
            this.selectedApp = app;
            this.finalResult = app.final_result || 'selected';
            this.showResultModal = true;
        },
        async updateFinalResult() {
            await axios.put(`${API_URL}/admin/applications/${this.selectedApp.id}/final-result`, 
                { final_result: this.finalResult },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            this.showResultModal = false;
            this.viewDriveApplications(this.selectedDriveId);
        },
        async loadPendingInterviews() {
            const response = await axios.get(`${API_URL}/admin/interviews/pending`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.pendingInterviews = response.data;
        },
        async approveInterview(id) {
            await axios.put(`${API_URL}/admin/interviews/${id}/approve`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.loadPendingInterviews();
        },
        async rejectInterview(id) {
            await axios.put(`${API_URL}/admin/interviews/${id}/reject`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.loadPendingInterviews();
        },
        async loadAllInterviews() {
            const response = await axios.get(`${API_URL}/admin/interviews/all`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.allInterviews = response.data;
        },
        toggleInterviewDetails(interviewId) {
            this.selectedInterviewId = this.selectedInterviewId === interviewId ? null : interviewId;
        },
        async triggerDailyReminders() {
            this.taskRunning = true;
            this.taskStatus = { type: 'alert-info', title: 'Sending Reminders...', message: 'Queuing daily reminder task via Google Chat webhook', loading: true };
            try {
                const response = await axios.post(`${API_URL}/admin/tasks/send-reminders`, {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setTimeout(() => this.checkTaskStatus(response.data.task_id, 'Daily Reminders', 0), 1000);
            } catch (err) {
                this.taskStatus = { type: 'alert-danger', title: 'Error', message: err.response?.data?.message || 'Failed to queue task', loading: false };
                this.taskRunning = false;
            }
        },
        async triggerMonthlyReport() {
            this.taskRunning = true;
            this.taskStatus = { type: 'alert-info', title: 'Generating Monthly Report...', message: 'Processing last 30 days of placement data', loading: true };
            try {
                const response = await axios.post(`${API_URL}/admin/tasks/monthly-report`, {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setTimeout(() => this.checkTaskStatus(response.data.task_id, 'Monthly Report', 0), 2000);
            } catch (err) {
                this.taskStatus = { type: 'alert-danger', title: 'Error', message: err.response?.data?.message || 'Failed to queue task', loading: false };
                this.taskRunning = false;
            }
        },
        async loadCacheStats() {
            try {
                const response = await axios.get(`${API_URL}/admin/cache/stats`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                this.cacheStats = response.data;
            } catch (err) {
                alert('Failed to load cache stats');
            }
        },
        async clearCache() {
            if (!confirm('Clear all Redis cache entries?')) return;
            try {
                await axios.post(`${API_URL}/admin/cache/clear`, {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                alert('Cache cleared successfully');
                this.loadCacheStats();
            } catch (err) {
                alert('Failed to clear cache');
            }
        },
        async triggerReportGeneration() {
            this.taskRunning = true;
            this.taskStatus = { type: 'alert-info', title: 'Task Queued', message: 'Generating comprehensive placement report...', loading: true };
            try {
                const response = await axios.post(`${API_URL}/admin/tasks/generate-report`, {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                const taskId = response.data.task_id;
                setTimeout(() => this.checkTaskStatus(taskId, 'Report Generation', 0), 1000);
            } catch (err) {
                this.taskStatus = { type: 'alert-danger', title: 'Error', message: err.response?.data?.message || 'Failed to queue task' };
                this.taskRunning = false;
            }
        },
        async checkTaskStatus(taskId, taskName, retries = 0) {
            try {
                const response = await axios.get(`${API_URL}/admin/tasks/status/${taskId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                const data = response.data;
                if (data.state === 'SUCCESS') {
                    const isReport = typeof data.result === 'object' && data.result !== null && 'placement_rate' in data.result;
                    this.taskStatus = {
                        type: 'alert-success',
                        title: `${taskName} Completed Successfully!`,
                        loading: false,
                        reportResult: isReport ? data.result : null,
                        plainResult: isReport ? null : (typeof data.result === 'string' ? data.result : JSON.stringify(data.result))
                    };
                    this.taskRunning = false;
                } else if (data.state === 'FAILURE') {
                    this.taskStatus = { type: 'alert-danger', title: 'Task Failed', message: data.error, loading: false };
                    this.taskRunning = false;
                } else if (retries >= 30) {
                    this.taskStatus = { type: 'alert-success', title: `${taskName} Completed!`, loading: false, plainResult: 'Task completed. Check Celery worker window for details.' };
                    this.taskRunning = false;
                } else {
                    setTimeout(() => this.checkTaskStatus(taskId, taskName, retries + 1), 1000);
                }
            } catch (err) {
                this.taskStatus = { type: 'alert-danger', title: 'Error', message: 'Failed to check task status', loading: false };
                this.taskRunning = false;
            }
        }
    },
    watch: {
        activeTab(newTab) {
            if (newTab === 'companies') this.loadCompanies();
            if (newTab === 'students') this.loadStudents();
            if (newTab === 'drives') this.loadDrives();
            if (newTab === 'interviews') this.loadPendingInterviews();
            if (newTab === 'allInterviews') this.loadAllInterviews();
            if (newTab === 'reports') this.loadReports();
        }
    }
};

const { createApp } = Vue;

const script1 = document.createElement('script');
script1.src = 'src/components/CompanyDashboard.js';
document.head.appendChild(script1);

const script2 = document.createElement('script');
script2.src = 'src/components/StudentDashboard.js';
document.head.appendChild(script2);

setTimeout(() => {
createApp({
    components: {
        LoginComponent,
        RegisterComponent,
        AdminDashboard,
        CompanyDashboard,
        StudentDashboard
    },
    data() {
        return {
            currentView: 'LoginComponent',
            isLoggedIn: false,
            userRole: '',
            showNotifications: false,
            notifications: [],
            unreadCount: 0,
            seenIds: []
        };
    },
    mounted() {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (token && role) {
            this.isLoggedIn = true;
            this.userRole = role;
            this.loadSeenIds();
            this.setDashboard(role);
            this.$nextTick(() => {
                if (role === 'student') {
                    this.loadNotifications();
                    setInterval(() => this.loadNotifications(), 30000);
                }
                if (role === 'company') {
                    this.loadCompanyNotifications();
                    setInterval(() => this.loadCompanyNotifications(), 30000);
                }
                if (role === 'admin') {
                    this.loadAdminNotifications();
                    setInterval(() => this.loadAdminNotifications(), 30000);
                }
            });
        }
    },
    methods: {
        toggleNotifications() {
            this.showNotifications = !this.showNotifications;
        },
        getSeenKey() {
            return `seen_notifs_${this.userRole}`;
        },
        loadSeenIds() {
            try {
                this.seenIds = JSON.parse(localStorage.getItem(this.getSeenKey()) || '[]');
            } catch { this.seenIds = []; }
        },
        markSeen(id) {
            if (!this.seenIds.includes(id)) {
                this.seenIds.push(id);
                localStorage.setItem(this.getSeenKey(), JSON.stringify(this.seenIds));
            }
            this.unreadCount = this.notifications.filter(n => !this.seenIds.includes(n.id)).length;
        },
        changeView(view) {
            if (view === 'register') {
                this.currentView = 'RegisterComponent';
            } else if (view === 'login') {
                this.currentView = 'LoginComponent';
            } else {
                this.currentView = view;
            }
        },
        handleLogin(role) {
            this.isLoggedIn = true;
            this.userRole = role;
            this.loadSeenIds();
            this.setDashboard(role);
            this.$nextTick(() => {
                if (role === 'student') {
                    this.loadNotifications();
                    setInterval(() => this.loadNotifications(), 30000);
                }
                if (role === 'company') {
                    this.loadCompanyNotifications();
                    setInterval(() => this.loadCompanyNotifications(), 30000);
                }
                if (role === 'admin') {
                    this.loadAdminNotifications();
                    setInterval(() => this.loadAdminNotifications(), 30000);
                }
            });
        },
        setDashboard(role) {
            if (role === 'admin') this.currentView = 'AdminDashboard';
            else if (role === 'company') this.currentView = 'CompanyDashboard';
            else if (role === 'student') this.currentView = 'StudentDashboard';
        },
        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            this.isLoggedIn = false;
            this.currentView = 'LoginComponent';
            this.notifications = [];
            this.unreadCount = 0;
            this.seenIds = [];
            this.showNotifications = false;
        },
        async loadNotifications() {
            if (this.userRole !== 'student') return;
            try {
                const response = await axios.get(`${API_URL}/student/applications`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                const applications = response.data;
                const notifs = [];
                applications.forEach(app => {
                    const appTime = new Date(app.application_date).getTime();
                    notifs.push({
                        id: `applied-${app.id}`,
                        title: `Applied: ${app.company_name}`,
                        message: `You applied to "${app.job_title}" at ${app.company_name}`,
                        date: new Date(app.application_date).toLocaleDateString(),
                        timestamp: appTime
                    });
                    if (app.status === 'shortlisted') {
                        notifs.push({
                            id: `status-shortlisted-${app.id}`,
                            title: `Shortlisted: ${app.company_name}`,
                            message: `You have been shortlisted for "${app.job_title}" at ${app.company_name}`,
                            date: new Date(app.application_date).toLocaleDateString(),
                            timestamp: appTime + 2
                        });
                    }
                    if (app.status === 'rejected') {
                        notifs.push({
                            id: `status-rejected-${app.id}`,
                            title: `Application Update: ${app.company_name}`,
                            message: `Your application for "${app.job_title}" at ${app.company_name} was not selected`,
                            date: new Date(app.application_date).toLocaleDateString(),
                            timestamp: appTime + 2
                        });
                    }
                    if (app.status === 'selected') {
                        notifs.push({
                            id: `status-selected-${app.id}`,
                            title: `Selected! ${app.company_name}`,
                            message: `Congratulations! You have been selected for "${app.job_title}" at ${app.company_name}`,
                            date: new Date(app.application_date).toLocaleDateString(),
                            timestamp: appTime + 2
                        });
                    }
                    if (app.final_result) {
                        notifs.push({
                            id: `final-${app.id}-${app.final_result}`,
                            title: `Final Result: ${app.company_name}`,
                            message: `Your final result for "${app.job_title}" is ${app.final_result.toUpperCase()}`,
                            date: new Date(app.application_date).toLocaleDateString(),
                            timestamp: appTime + 3
                        });
                    }
                    if (app.interviews && app.interviews.length > 0) {
                        app.interviews.forEach(interview => {
                            if (interview.status === 'approved') {
                                notifs.push({
                                    id: `interview-${interview.id}`,
                                    title: `Interview Scheduled: ${app.company_name}`,
                                    message: `Interview on ${new Date(interview.interview_date).toLocaleString()} — ${interview.interview_mode}${interview.location ? ' at ' + interview.location : ''}`,
                                    date: new Date(interview.interview_date).toLocaleDateString(),
                                    timestamp: new Date(interview.interview_date).getTime()
                                });
                                if (interview.rounds && interview.rounds.length > 0) {
                                    interview.rounds.forEach(round => {
                                        const roundDate = round.round_date ? new Date(round.round_date) : new Date();
                                        notifs.push({
                                            id: `round-sched-${interview.id}-${round.round_number}`,
                                            title: `Round ${round.round_number} Scheduled: ${app.company_name}`,
                                            message: `${round.round_name}${round.round_date ? ' on ' + roundDate.toLocaleString() : ' — date TBD'}`,
                                            date: round.round_date ? roundDate.toLocaleDateString() : 'TBD',
                                            timestamp: roundDate.getTime()
                                        });
                                        if (round.result === 'passed' || round.result === 'rejected') {
                                            notifs.push({
                                                id: `round-result-${interview.id}-${round.round_number}`,
                                                title: `Round Result: ${round.round_name} — ${app.company_name}`,
                                                message: `You ${round.result === 'passed' ? 'passed ✓' : 'did not pass'} ${round.round_name}${round.feedback ? '. Feedback: ' + round.feedback : ''}`,
                                                date: round.round_date ? roundDate.toLocaleDateString() : 'TBD',
                                                timestamp: roundDate.getTime() + 1
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
                notifs.sort((a, b) => b.timestamp - a.timestamp);
                this.notifications = notifs.slice(0, 30);
                this.unreadCount = this.notifications.filter(n => !this.seenIds.includes(n.id)).length;
            } catch (err) {
                console.error('Failed to load notifications');
            }
        },
        async loadCompanyNotifications() {
            if (this.userRole !== 'company') return;
            try {
                const [dashRes, interviewRes] = await Promise.all([
                    axios.get(`${API_URL}/company/dashboard`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
                    axios.get(`${API_URL}/company/interviews`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
                ]);
                const drives = dashRes.data.drives || [];
                const interviews = interviewRes.data;
                const notifs = [];

                for (const drive of drives) {
                    notifs.push({
                        id: `drive-status-${drive.id}`,
                        title: `Drive ${drive.status}: ${drive.job_title}`,
                        message: `Your drive "${drive.job_title}" is ${drive.status}. ${drive.applicants} applicant(s).`,
                        date: new Date(drive.deadline).toLocaleDateString(),
                        timestamp: new Date(drive.deadline).getTime()
                    });

                    const appRes = await axios.get(`${API_URL}/company/drives/${drive.id}/applications`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }).catch(() => ({ data: [] }));
                    appRes.data.forEach(app => {
                        notifs.push({
                            id: `app-received-${app.id}`,
                            title: `New Application: ${app.student_name}`,
                            message: `${app.student_name} (${app.roll_number}) applied to "${drive.job_title}" — Status: ${app.status}`,
                            date: new Date(app.application_date).toLocaleDateString(),
                            timestamp: new Date(app.application_date).getTime()
                        });
                    });
                }

                interviews.forEach(interview => {
                    notifs.push({
                        id: `interview-approved-${interview.id}`,
                        title: `Interview Approved: ${interview.student_name}`,
                        message: `Interview for "${interview.job_title}" on ${new Date(interview.interview_date).toLocaleString()}`,
                        date: new Date(interview.interview_date).toLocaleDateString(),
                        timestamp: new Date(interview.interview_date).getTime()
                    });
                    interview.rounds && interview.rounds.forEach(round => {
                        if (round.result && round.result !== 'pending') {
                            notifs.push({
                                id: `round-result-${round.id}`,
                                title: `Round Result: ${round.round_name} — ${interview.student_name}`,
                                message: `${interview.student_name} ${round.result === 'passed' ? 'passed' : 'did not pass'} ${round.round_name}${round.feedback ? '. Feedback: ' + round.feedback : ''}`,
                                date: round.round_date ? new Date(round.round_date).toLocaleDateString() : 'N/A',
                                timestamp: round.round_date ? new Date(round.round_date).getTime() : Date.now()
                            });
                        }
                    });
                });

                notifs.sort((a, b) => b.timestamp - a.timestamp);
                this.notifications = notifs.slice(0, 30);
                this.unreadCount = this.notifications.filter(n => !this.seenIds.includes(n.id)).length;
            } catch (err) {
                console.error('Failed to load company notifications');
            }
        },
        async loadAdminNotifications() {
            if (this.userRole !== 'admin') return;
            try {
                const response = await axios.get(`${API_URL}/admin/notifications`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                const notifs = response.data.map(n => ({
                    ...n,
                    date: new Date(n.timestamp).toLocaleDateString(),
                    timestamp: new Date(n.timestamp).getTime()
                })).sort((a, b) => b.timestamp - a.timestamp);
                this.notifications = notifs;
                this.unreadCount = notifs.filter(n => !this.seenIds.includes(n.id)).length;
            } catch (err) {
                console.error('Failed to load admin notifications');
            }
        }
    }
}).mount('#app');
}, 100);
