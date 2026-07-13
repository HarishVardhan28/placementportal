const CompanyDashboard = {
    template: `
        <div>
            <div class="card mb-3" style="background: #0066cc; color: white;">
                <div class="card-body">
                    <h4 style="margin: 0; color: white;">{{ profile.company_name }}</h4>
                    <p style="margin: 0.3rem 0 0 0; color: white;">Company Dashboard</p>
                </div>
            </div>
            <div class="alert alert-info" v-if="profile.approval_status === 'pending'">
                Your company is pending approval from admin.
            </div>
            <div class="alert alert-danger" v-if="profile.approval_status === 'rejected'">
                Your company registration was rejected.
            </div>

            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5>Company: {{ profile.company_name }}</h5>
                            <p>Status: {{ profile.approval_status }}</p>
                            <p>Total Drives: {{ drives.length }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <button class="btn btn-primary mb-3" @click="showCreateForm = true" v-if="profile.approval_status === 'approved'">Create New Drive</button>
            <button class="btn btn-secondary mb-3 ms-2" @click="showEditProfile = !showEditProfile">Edit Profile</button>

            <div v-if="showEditProfile" class="card mb-3">
                <div class="card-body">
                    <h5>Edit Company Profile</h5>
                    <form @submit.prevent="updateProfile">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">HR Name</label>
                                <input type="text" class="form-control" v-model="editProfile.hr_name" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">HR Contact</label>
                                <input type="text" class="form-control" v-model="editProfile.hr_contact" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Website</label>
                                <input type="text" class="form-control" v-model="editProfile.website">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" v-model="editProfile.description" rows="2"></textarea>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-success">Save Changes</button>
                        <button type="button" class="btn btn-secondary ms-2" @click="showEditProfile = false">Cancel</button>
                    </form>
                </div>
            </div>

            <ul class="nav nav-tabs mb-3">
                <li class="nav-item">
                    <a class="nav-link" :class="{active: activeTab === 'drives'}" @click="activeTab = 'drives'">My Drives</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" :class="{active: activeTab === 'interviews'}" @click="activeTab = 'interviews'">Interview Requests</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" :class="{active: activeTab === 'analytics'}" @click="activeTab = 'analytics'">Analytics</a>
                </li>
            </ul>

            <div v-if="showCreateForm" class="card mb-3">
                <div class="card-body">
                    <h5>Create Placement Drive</h5>
                    <form @submit.prevent="createDrive">
                        <div class="mb-3">
                            <label class="form-label">Job Title</label>
                            <input type="text" class="form-control" v-model="newDrive.job_title" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Job Description</label>
                            <textarea class="form-control" v-model="newDrive.job_description" required></textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Required Branch</label>
                            <input type="text" class="form-control" v-model="newDrive.required_branch" placeholder="e.g., CSE, ECE, IT (comma-separated)">
                            <small class="text-muted">Leave empty for all branches, or enter comma-separated values</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Minimum CGPA</label>
                            <input type="number" step="0.01" class="form-control" v-model="newDrive.min_cgpa">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Required Year</label>
                            <input type="text" class="form-control" v-model="newDrive.required_year" placeholder="e.g., 3, 4 (comma-separated)">
                            <small class="text-muted">Leave empty for all years, or enter comma-separated values</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Salary Package</label>
                            <input type="text" class="form-control" v-model="newDrive.salary_package">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Application Deadline</label>
                            <input type="datetime-local" class="form-control" v-model="newDrive.application_deadline" required>
                        </div>
                        <button type="submit" class="btn btn-success">Create Drive</button>
                        <button type="button" class="btn btn-secondary" @click="showCreateForm = false">Cancel</button>
                    </form>
                </div>
            </div>

            <h4 v-if="activeTab === 'drives'">My Drives</h4>
            <table class="table table-striped" v-if="activeTab === 'drives'">
                <thead>
                    <tr>
                        <th>Job Title</th>
                        <th>Status</th>
                        <th>Applicants</th>
                        <th>Deadline</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="drive in drives" :key="drive.id">
                        <tr>
                            <td>{{ drive.job_title }}</td>
                            <td>{{ drive.status }}</td>
                            <td>{{ drive.applicants }}</td>
                            <td>{{ new Date(drive.deadline).toLocaleDateString() }}</td>
                            <td>
                                <button class="btn btn-sm btn-info" @click="viewApplications(drive.id)">{{ selectedDrive === drive.id ? 'Hide' : 'View' }} Applications</button>
                            </td>
                        </tr>
                        <tr v-if="selectedDrive === drive.id && applications.length > 0">
                            <td colspan="5">
                                <div class="p-3 bg-light">
                                    <h6>Applications for {{ drive.job_title }}</h6>
                                    <table class="table table-sm table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Student Name</th>
                                                <th>Roll Number</th>
                                                <th>Branch</th>
                                                <th>CGPA</th>
                                                <th>Status</th>
                                                <th>Resume</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="app in applications" :key="app.id">
                                                <td>{{ app.student_name }}</td>
                                                <td>{{ app.roll_number }}</td>
                                                <td>{{ app.branch }}</td>
                                                <td>{{ app.cgpa }}</td>
                                                <td>{{ app.status }}</td>
                                                <td>
                                                    <a v-if="app.resume_filename" :href="'http://localhost:5000/api/student/resume/download/' + app.student_id" class="btn btn-sm btn-info" target="_blank">View</a>
                                                    <span v-else class="text-muted">-</span>
                                                </td>
                                                <td>
                                                    <button class="btn btn-sm btn-primary me-1" @click="showRequestInterview(app)">Request Interview</button>
                                                    <button class="btn btn-sm btn-success" @click="showFinalResultModal(app)">Final Result</button>
                                                    <select class="form-select form-select-sm mt-1" @change="updateStatus(app.id, $event.target.value)">
                                                        <option value="applied" :selected="app.status === 'applied'">Applied</option>
                                                        <option value="shortlisted" :selected="app.status === 'shortlisted'">Shortlisted</option>
                                                        <option value="selected" :selected="app.status === 'selected'">Selected</option>
                                                        <option value="rejected" :selected="app.status === 'rejected'">Rejected</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="selectedDrive === drive.id && applications.length === 0">
                            <td colspan="5" class="text-center text-muted p-3">
                                No applications yet
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>

            <div v-if="activeTab === 'interviews'">
                <h4>Approved Interviews - Manage Rounds</h4>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Student Roll no.</th>
                            <th>Student</th>
                            <th>Job Title</th>
                            <th>Interview Date</th>
                            <th>Mode</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="interview in interviews" :key="interview.id">
                            <tr>
                                <td>{{ interview.student_roll }}</td>
                                <td>{{ interview.student_name }}</td>
                                <td>{{ interview.job_title }}</td>
                                <td>{{ new Date(interview.interview_date).toLocaleString() }}</td>
                                <td>{{ interview.interview_mode }}</td>
                                <td>{{ interview.location }}</td>
                                <td>
                                    <span class="badge" :class="{
                                        'bg-warning': interview.status === 'pending',
                                        'bg-success': interview.status === 'approved',
                                        'bg-danger': interview.status === 'rejected'
                                    }">{{ interview.status }}</span>
                                </td>
                                <td>
                                    <button v-if="interview.status === 'approved'" class="btn btn-sm btn-primary" @click="manageRounds(interview)">Manage Rounds</button>
                                </td>
                            </tr>
                            <tr v-if="selectedInterview?.id === interview.id">
                                <td colspan="7">
                                    <div class="p-3 bg-light">
                                        <h6>Interview Rounds</h6>
                                        <button class="btn btn-sm btn-success mb-2" @click="showAddRoundModal = true">Add Round</button>
                                        <table class="table table-sm table-bordered" v-if="interview.rounds.length > 0">
                                            <thead>
                                                <tr>
                                                    <th>Round #</th>
                                                    <th>Round Name</th>
                                                    <th>Date</th>
                                                    <th>Result</th>
                                                    <th>Feedback</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr v-for="round in interview.rounds" :key="round.id">
                                                    <td>{{ round.round_number }}</td>
                                                    <td>{{ round.round_name }}</td>
                                                    <td>{{ round.round_date ? new Date(round.round_date).toLocaleString() : '-' }}</td>
                                                    <td>
                                                        <span class="badge" :class="{
                                                            'bg-warning': round.result === 'pending',
                                                            'bg-success': round.result === 'passed',
                                                            'bg-danger': round.result === 'rejected'
                                                        }">{{ round.result }}</span>
                                                    </td>
                                                    <td>{{ round.feedback || '-' }}</td>
                                                    <td>
                                                        <button class="btn btn-sm btn-info" @click="updateRoundResult(round)">Update Result</button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <p v-else class="text-muted">No rounds added yet</p>
                                        <button class="btn btn-sm btn-success mt-2" @click="showFinalResultForInterview(interview)">Set Final Result</button>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>

            <div v-if="activeTab === 'analytics'">
                <h4>Recruitment Analytics</h4>
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-white bg-primary">
                            <div class="card-body">
                                <h6>Total Drives</h6>
                                <h2>{{ drives.length }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white bg-info">
                            <div class="card-body">
                                <h6>Total Applicants</h6>
                                <h2>{{ drives.reduce((sum, d) => sum + d.applicants, 0) }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white bg-success">
                            <div class="card-body">
                                <h6>Approved Drives</h6>
                                <h2>{{ drives.filter(d => d.status === 'approved').length }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white bg-warning">
                            <div class="card-body">
                                <h6>Pending Interviews</h6>
                                <h2>{{ interviews.filter(i => i.status === 'pending').length }}</h2>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header"><h5>Drive Performance</h5></div>
                            <div class="card-body"><canvas id="companyDriveChart"></canvas></div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header"><h5>Recent Drives</h5></div>
                            <div class="card-body">
                                <table class="table table-sm">
                                    <thead>
                                        <tr><th>Job Title</th><th>Applicants</th><th>Status</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="drive in drives.slice(0, 5)" :key="drive.id">
                                            <td>{{ drive.job_title }}</td>
                                            <td>{{ drive.applicants }}</td>
                                            <td><span class="badge" :class="drive.status === 'approved' ? 'bg-success' : 'bg-warning'">{{ drive.status }}</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add Round Modal -->
            <div v-if="showAddRoundModal" style="display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1055;">
                <div class="modal-dialog" style="pointer-events:auto;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add Interview Round</h5>
                            <button type="button" class="btn-close" @click="showAddRoundModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Round Number</label>
                                <input type="number" class="form-control" v-model="newRound.round_number" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Round Name</label>
                                <input type="text" class="form-control" v-model="newRound.round_name" placeholder="e.g., Technical Round, HR Round" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Round Date & Time</label>
                                <input type="datetime-local" class="form-control" v-model="newRound.round_date">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showAddRoundModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="addRound">Add Round</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Update Round Result Modal -->
            <div v-if="showRoundResultModal" style="display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1055;">
                <div class="modal-dialog" style="pointer-events:auto;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Update Round Result</h5>
                            <button type="button" class="btn-close" @click="showRoundResultModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Round: {{ selectedRound?.round_name }}</label>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Result</label>
                                <select class="form-select" v-model="roundResult.result" required>
                                    <option value="pending">Pending</option>
                                    <option value="passed">Passed</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Feedback</label>
                                <textarea class="form-control" v-model="roundResult.feedback" rows="3"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showRoundResultModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="saveRoundResult">Save Result</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Request Interview Modal -->
            <div v-if="showInterviewModal" style="display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1055;">
                <div class="modal-dialog" style="pointer-events:auto;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Request Interview</h5>
                            <button type="button" class="btn-close" @click="showInterviewModal = false"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Student: {{ selectedApp?.student_name }}</label>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Interview Date & Time</label>
                                <input type="datetime-local" class="form-control" v-model="interviewData.interview_date" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Interview Mode</label>
                                <select class="form-select" v-model="interviewData.interview_mode" required>
                                    <option value="online">Online</option>
                                    <option value="offline">Offline</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Location/Link</label>
                                <input type="text" class="form-control" v-model="interviewData.location">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Notes</label>
                                <textarea class="form-control" v-model="interviewData.notes"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="showInterviewModal = false">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="requestInterview">Submit Request</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Final Result Modal -->
            <div v-if="showResultModal" style="display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1055;">
                <div class="modal-dialog" style="pointer-events:auto;">
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
            profile: {},
            drives: [],
            showCreateForm: false,
            newDrive: {},
            selectedDrive: null,
            applications: [],
            showInterviewModal: false,
            showResultModal: false,
            selectedApp: null,
            interviewData: {},
            finalResult: '',
            activeTab: 'drives',
            interviews: [],
            driveChart: null,
            selectedInterview: null,
            showAddRoundModal: false,
            showRoundResultModal: false,
            newRound: {},
            selectedRound: null,
            roundResult: {},
            showEditProfile: false,
            editProfile: {}
        };
    },
    computed: {
        authToken() {
            return localStorage.getItem('token');
        }
    },
    mounted() {
        this.loadProfile();
        this.loadDrives();
        this.loadInterviews();
    },
    methods: {
        async loadProfile() {
            const response = await axios.get(`${API_URL}/company/profile`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.profile = response.data;
            this.editProfile = { hr_name: response.data.hr_name, hr_contact: response.data.hr_contact, website: response.data.website, description: response.data.description };
        },
        async updateProfile() {
            try {
                await axios.put(`${API_URL}/company/profile`, this.editProfile, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                this.showEditProfile = false;
                await this.loadProfile();
                alert('Profile updated successfully!');
            } catch (err) {
                alert(err.response?.data?.error || 'Failed to update profile');
            }
        },
        async loadDrives() {
            const response = await axios.get(`${API_URL}/company/dashboard`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.drives = response.data.drives;
        },
        async createDrive() {
            try {
                await axios.post(`${API_URL}/company/drives`, this.newDrive, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                this.showCreateForm = false;
                this.newDrive = {};
                this.loadDrives();
                alert('Drive created successfully!');
            } catch (err) {
                alert(err.response?.data?.error || 'Failed to create drive');
            }
        },
        async viewApplications(driveId) {
            if (this.selectedDrive === driveId) {
                this.selectedDrive = null;
                this.applications = [];
            } else {
                this.selectedDrive = driveId;
                const response = await axios.get(`${API_URL}/company/drives/${driveId}/applications`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                this.applications = response.data;
            }
        },
        async updateStatus(appId, status) {
            await axios.put(`${API_URL}/company/applications/${appId}/status`, { status }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.viewApplications(this.selectedDrive);
        },
        showRequestInterview(app) {
            this.selectedApp = app;
            this.interviewData = { interview_mode: 'online' };
            this.showInterviewModal = true;
        },
        async requestInterview() {
            await axios.post(`${API_URL}/company/applications/${this.selectedApp.id}/request-interview`, this.interviewData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert('Interview request submitted for admin approval');
            this.showInterviewModal = false;
            this.loadInterviews();
        },
        showFinalResultModal(app) {
            this.selectedApp = app;
            this.finalResult = 'selected';
            this.showResultModal = true;
        },
        async updateFinalResult() {
            try {
                await axios.put(`${API_URL}/company/applications/${this.selectedApp.id}/final-result`, 
                    { final_result: this.finalResult },
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                );
                this.showResultModal = false;
                alert(`Final result set to "${this.finalResult}" for ${this.selectedApp.student_name}`);
                this.viewApplications(this.selectedDrive);
            } catch (err) {
                alert(err.response?.data?.error || 'Failed to update final result');
            }
        },
        async loadInterviews() {
            const response = await axios.get(`${API_URL}/company/interviews`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.interviews = response.data;
        },
        manageRounds(interview) {
            if (this.selectedInterview?.id === interview.id) {
                this.selectedInterview = null;
            } else {
                this.selectedInterview = interview;
            }
        },
        async addRound() {
            try {
                await axios.post(`${API_URL}/company/interviews/${this.selectedInterview.id}/rounds`, this.newRound, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                this.showAddRoundModal = false;
                this.newRound = {};
                await this.loadInterviews();
                this.selectedInterview = this.interviews.find(i => i.id === this.selectedInterview.id);
                alert('Round added successfully');
            } catch (err) {
                alert(err.response?.data?.error || 'Failed to add round');
            }
        },
        updateRoundResult(round) {
            this.selectedRound = round;
            this.roundResult = { result: round.result, feedback: round.feedback };
            this.showRoundResultModal = true;
        },
        async saveRoundResult() {
            try {
                await axios.put(`${API_URL}/company/rounds/${this.selectedRound.id}/result`, this.roundResult, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                this.showRoundResultModal = false;
                await this.loadInterviews();
                this.selectedInterview = this.interviews.find(i => i.id === this.selectedInterview.id);
                alert('Round result updated');
            } catch (err) {
                alert(err.response?.data?.error || 'Failed to update result');
            }
        },
        showFinalResultForInterview(interview) {
            this.selectedApp = { id: interview.application_id, student_name: interview.student_name };
            this.finalResult = 'selected';
            this.showResultModal = true;
        },
        renderCompanyChart() {
            if (this.driveChart) this.driveChart.destroy();
            const ctx = document.getElementById('companyDriveChart');
            if (ctx && this.drives.length > 0) {
                this.driveChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: this.drives.slice(0, 5).map(d => d.job_title),
                        datasets: [{
                            label: 'Applicants',
                            data: this.drives.slice(0, 5).map(d => d.applicants),
                            backgroundColor: '#2563eb'
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: true }
                });
            }
        }
    },
    watch: {
        activeTab(newTab) {
            if (newTab === 'analytics') {
                this.$nextTick(() => this.renderCompanyChart());
            }
        }
    }
};
