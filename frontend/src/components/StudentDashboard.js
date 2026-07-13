const StudentDashboard = {
    template: `
        <div>
            <div class="card mb-3" style="background: #0066cc; color: white;">
                <div class="card-body">
                    <h4 style="margin: 0; color: white;">Welcome, {{ profile.full_name }}</h4>
                    <p style="margin: 0.3rem 0 0 0; color: white;">Student Dashboard</p>
                </div>
            </div>
            <div v-if="exportAlert" class="alert alert-success alert-dismissible d-flex align-items-center gap-2" role="alert" style="position:sticky;top:10px;z-index:999;">
                <span>{{ exportAlert }}</span>
                <button type="button" class="btn-close ms-auto" @click="exportAlert = ''"></button>
            </div>
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5>Welcome, {{ profile.full_name }}</h5>
                            <p>Roll: {{ profile.roll_number }}</p>
                            <p>Branch: {{ profile.branch }} | CGPA: {{ profile.cgpa }}</p>
                            <p v-if="profile.resume_filename" class="text-success">Resume uploaded: {{ profile.resume_filename }}</p>
                            <p v-else class="text-danger">No resume uploaded</p>
                            <button class="btn btn-sm btn-primary me-2" @click="showEditProfile = true">Edit Profile</button>
                            <button class="btn btn-sm btn-success me-2" @click="showResumeUpload = true">Upload Resume</button>
                            <a v-if="profile.id" :href="'http://localhost:5000/api/student/resume/download/' + profile.id" target="_blank" class="btn btn-sm btn-info">View Resume</a>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5>My Applications</h5>
                            <h3>{{ myApplications.length }}</h3>
                            <button class="btn btn-sm btn-success me-2" @click="exportApplications">Export CSV</button>
                            <button class="btn btn-sm btn-outline-success" @click="exportAsync" :disabled="asyncExportLoading">Async Export</button>
                            <div v-if="asyncExportStatus" class="mt-2">
                                <span v-if="asyncExportLoading" class="text-muted">Processing... <span class="spinner-border spinner-border-sm"></span></span>
                                <a v-if="asyncExportReady" href="#" @click.prevent="downloadAsyncCsv" class="btn btn-sm btn-success">Download Ready ↓</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="showEditProfile" class="card mb-3">
                <div class="card-body">
                    <h5>Edit Profile</h5>
                    <form @submit.prevent="updateProfile">
                        <div class="mb-3">
                            <label class="form-label">Full Name</label>
                            <input type="text" class="form-control" v-model="profile.full_name">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Phone</label>
                            <input type="text" class="form-control" v-model="profile.phone">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Branch</label>
                            <input type="text" class="form-control" v-model="profile.branch">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">CGPA</label>
                            <input type="number" step="0.01" class="form-control" v-model="profile.cgpa">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Year</label>
                            <input type="number" class="form-control" v-model="profile.year">
                        </div>
                        <button type="submit" class="btn btn-success">Update</button>
                        <button type="button" class="btn btn-secondary" @click="showEditProfile = false">Cancel</button>
                    </form>
                </div>
            </div>

            <div v-if="showResumeUpload" class="card mb-3">
                <div class="card-body">
                    <h5>Upload Resume (PDF only)</h5>
                    <form @submit.prevent="uploadResume">
                        <div class="mb-3">
                            <input type="file" class="form-control" @change="handleFileSelect" accept=".pdf" required>
                        </div>
                        <button type="submit" class="btn btn-success">Upload</button>
                        <button type="button" class="btn btn-secondary" @click="showResumeUpload = false">Cancel</button>
                    </form>
                </div>
            </div>

            <ul class="nav nav-tabs mb-3">
                <li class="nav-item">
                    <a class="nav-link" :class="{active: activeTab === 'drives'}" @click="activeTab = 'drives'">Available Drives</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" :class="{active: activeTab === 'applications'}" @click="activeTab = 'applications'">My Applications</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" :class="{active: activeTab === 'analytics'}" @click="activeTab = 'analytics'">Analytics</a>
                </li>
            </ul>

            <div v-if="activeTab === 'drives'">
                <input type="text" class="form-control mb-3" v-model="searchQuery" @input="loadDrives" placeholder="Search drives...">
                <div v-if="drives.length === 0" class="alert alert-info">
                    No placement drives available at the moment. Please check back later.
                </div>
                <div class="row">
                    <div class="col-md-6" v-for="drive in drives" :key="drive.id">
                        <div class="card mb-3">
                            <div class="card-body">
                                <h5>{{ drive.job_title }}</h5>
                                <p><strong>{{ drive.company_name }}</strong></p>
                                <p>{{ drive.job_description }}</p>
                                <p><small>Branch: {{ drive.required_branch || 'Any' }} | Min CGPA: {{ drive.min_cgpa }} | Year: {{ drive.required_year || 'Any' }}</small></p>
                                <p><small>Deadline: {{ new Date(drive.application_deadline).toLocaleDateString() }}</small></p>
                                <p v-if="drive.salary_package"><small>Package: {{ drive.salary_package }}</small></p>
                                <span v-if="!profile.resume_filename" class="text-danger" style="font-size:0.85rem;">Upload your resume to apply</span>
                                <button v-else-if="!drive.hasApplied" class="btn btn-primary" @click="applyToDrive(drive.id)">Apply Now</button>
                                <button v-else class="btn btn-success" disabled>Applied</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="activeTab === 'applications'">
                <h4>My Applications</h4>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Job Title</th>
                            <th>Status</th>
                            <th>Final Result</th>
                            <th>Applied Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="app in myApplications" :key="app.id">
                            <tr>
                                <td>{{ app.company_name }}</td>
                                <td>{{ app.job_title }}</td>
                                <td><span class="badge" :class="getStatusClass(app.status)">{{ app.status }}</span></td>
                                <td>
                                    <span v-if="app.final_result" class="badge" :class="getFinalResultClass(app.final_result)">{{ app.final_result }}</span>
                                    <span v-else class="text-muted">Pending</span>
                                </td>
                                <td>{{ new Date(app.application_date).toLocaleDateString() }}</td>
                                <td>
                                    <button v-if="app.interviews && app.interviews.length > 0" class="btn btn-sm btn-info" @click="toggleInterviewDetails(app.id)">
                                        {{ selectedApp === app.id ? 'Hide' : 'View' }} Interviews
                                    </button>
                                    <span v-else class="text-muted">No interviews</span>
                                </td>
                            </tr>
                            <tr v-if="selectedApp === app.id && app.interviews && app.interviews.length > 0">
                                <td colspan="6">
                                    <div class="p-3 bg-light">
                                        <h6>Interview Details</h6>
                                        <div v-for="interview in app.interviews" :key="interview.id" class="mb-3 border p-3 bg-white rounded">
                                            <div class="row mb-2">
                                                <div class="col-md-6">
                                                    <strong>Interview Date:</strong> {{ new Date(interview.interview_date).toLocaleString() }}
                                                </div>
                                                <div class="col-md-6">
                                                    <strong>Status:</strong> 
                                                    <span class="badge" :class="getInterviewStatusClass(interview.status)">{{ interview.status }}</span>
                                                </div>
                                            </div>
                                            <div class="row mb-2">
                                                <div class="col-md-6">
                                                    <strong>Mode:</strong> {{ interview.interview_mode }}
                                                </div>
                                                <div class="col-md-6">
                                                    <strong>Location:</strong> {{ interview.location || 'N/A' }}
                                                </div>
                                            </div>
                                            <div v-if="interview.notes" class="mb-2">
                                                <strong>Notes:</strong> {{ interview.notes }}
                                            </div>
                                            
                                            <div v-if="interview.rounds && interview.rounds.length > 0" class="mt-3">
                                                <h6 class="text-primary">Interview Rounds</h6>
                                                <table class="table table-sm table-bordered">
                                                    <thead class="table-light">
                                                        <tr>
                                                            <th>Round #</th>
                                                            <th>Round Name</th>
                                                            <th>Date</th>
                                                            <th>Result</th>
                                                            <th>Feedback</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr v-for="round in interview.rounds" :key="round.round_number">
                                                            <td>{{ round.round_number }}</td>
                                                            <td>{{ round.round_name }}</td>
                                                            <td>{{ round.round_date ? new Date(round.round_date).toLocaleString() : 'TBD' }}</td>
                                                            <td>
                                                                <span class="badge" :class="getRoundResultClass(round.result)">{{ round.result }}</span>
                                                            </td>
                                                            <td>{{ round.feedback || '-' }}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div v-else class="mt-2 text-muted">
                                                <em>No rounds scheduled yet</em>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>

            <div v-if="activeTab === 'analytics'">
                <h4>My Application Analytics</h4>
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-white bg-primary">
                            <div class="card-body">
                                <h6>Total Applications</h6>
                                <h2>{{ myApplications.length }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white bg-warning">
                            <div class="card-body">
                                <h6>Shortlisted</h6>
                                <h2>{{ myApplications.filter(a => a.status === 'shortlisted').length }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white bg-success">
                            <div class="card-body">
                                <h6>Selected</h6>
                                <h2>{{ myApplications.filter(a => a.status === 'selected').length }}</h2>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white bg-info">
                            <div class="card-body">
                                <h6>Interviews</h6>
                                <h2>{{ myApplications.filter(a => a.interviews && a.interviews.length > 0).length }}</h2>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header"><h5>Application Status</h5></div>
                            <div class="card-body"><canvas id="studentStatusChart"></canvas></div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header"><h5>Application Timeline</h5></div>
                            <div class="card-body">
                                <table class="table table-sm">
                                    <thead>
                                        <tr><th>Company</th><th>Date</th><th>Status</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="app in myApplications.slice().reverse().slice(0, 5)" :key="app.id">
                                            <td>{{ app.company_name }}</td>
                                            <td>{{ new Date(app.application_date).toLocaleDateString() }}</td>
                                            <td><span class="badge" :class="getStatusClass(app.status)">{{ app.status }}</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
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
            myApplications: [],
            activeTab: 'drives',
            searchQuery: '',
            showEditProfile: false,
            showResumeUpload: false,
            selectedFile: null,
            statusChart: null,
            selectedApp: null,
            asyncExportLoading: false,
            asyncExportStatus: false,
            asyncExportReady: false,
            asyncCsvData: null,
            exportAlert: ''
        };
    },
    mounted() {
        this.loadProfile();
        this.loadDrives();
        this.loadApplications();
    },
    methods: {
        async loadProfile() {
            const response = await axios.get(`${API_URL}/student/profile`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.profile = response.data;
        },
        async updateProfile() {
            await axios.put(`${API_URL}/student/profile`, this.profile, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.showEditProfile = false;
            alert('Profile updated successfully!');
        },
        async loadDrives() {
            try {
                const response = await axios.get(`${API_URL}/drives?search=${this.searchQuery}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                this.drives = response.data;
                this.drives.forEach(drive => {
                    drive.hasApplied = this.myApplications.some(app => app.drive_id === drive.id);
                });
            } catch (err) {
                console.error('Error loading drives:', err);
                alert('Failed to load placement drives');
            }
        },
        async loadApplications() {
            const response = await axios.get(`${API_URL}/student/applications`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            this.myApplications = response.data;
            if (this.drives.length > 0) {
                this.drives.forEach(drive => {
                    drive.hasApplied = this.myApplications.some(app => app.drive_id === drive.id);
                });
            }
        },
        async applyToDrive(driveId) {
            try {
                await axios.post(`${API_URL}/drives/${driveId}/apply`, {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                alert('Application submitted successfully!');
                await this.loadApplications();
                await this.loadDrives();
            } catch (err) {
                alert(err.response?.data?.error || 'Failed to apply');
            }
        },
        async exportAsync() {
            this.asyncExportLoading = true;
            this.asyncExportStatus = true;
            this.asyncExportReady = false;
            this.asyncCsvData = null;
            try {
                const res = await axios.post(`${API_URL}/student/applications/export/async`, {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                this.pollAsyncExport(res.data.task_id);
            } catch (err) {
                alert('Failed to start async export');
                this.asyncExportLoading = false;
            }
        },
        async pollAsyncExport(taskId) {
            try {
                const res = await axios.get(`${API_URL}/student/applications/export/status/${taskId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.data.state === 'SUCCESS') {
                    this.asyncCsvData = res.data.result;
                    this.asyncExportLoading = false;
                    this.asyncExportReady = true;
                    // Show alert notification
                    this.exportAlert = 'CSV export is ready. Click Download Ready to save it.';
                    setTimeout(() => { this.exportAlert = ''; }, 8000);
                } else if (res.data.state === 'FAILURE') {
                    alert('Export failed: ' + res.data.error);
                    this.asyncExportLoading = false;
                } else {
                    setTimeout(() => this.pollAsyncExport(taskId), 1500);
                }
            } catch (err) {
                this.asyncExportLoading = false;
            }
        },
        downloadAsyncCsv() {
            if (!this.asyncCsvData) return;
            const blob = new Blob([this.asyncCsvData.csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.asyncCsvData.filename || 'applications.csv';
            a.click();
            URL.revokeObjectURL(url);
            this.asyncExportStatus = false;
            this.asyncExportReady = false;
        },
        async exportApplications() {
            try {
                const response = await axios.get(`${API_URL}/student/applications/export`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    responseType: 'blob'
                });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'applications.csv');
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (err) {
                alert('Failed to export applications');
            }
        },
        getStatusClass(status) {
            const classes = {
                'applied': 'bg-info',
                'shortlisted': 'bg-warning',
                'selected': 'bg-success',
                'rejected': 'bg-danger'
            };
            return classes[status] || 'bg-secondary';
        },
        getFinalResultClass(result) {
            const classes = {
                'selected': 'bg-success',
                'rejected': 'bg-danger',
                'on-hold': 'bg-warning'
            };
            return classes[result] || 'bg-secondary';
        },
        getInterviewStatusClass(status) {
            const classes = {
                'pending': 'bg-warning',
                'approved': 'bg-success',
                'rejected': 'bg-danger'
            };
            return classes[status] || 'bg-secondary';
        },
        getRoundResultClass(result) {
            const classes = {
                'pending': 'bg-warning text-dark',
                'passed': 'bg-success',
                'rejected': 'bg-danger'
            };
            return classes[result] || 'bg-secondary';
        },
        toggleInterviewDetails(appId) {
            this.selectedApp = this.selectedApp === appId ? null : appId;
        },
        handleFileSelect(event) {
            this.selectedFile = event.target.files[0];
        },
        async uploadResume() {
            if (!this.selectedFile) {
                alert('Please select a file');
                return;
            }
            const formData = new FormData();
            formData.append('resume', this.selectedFile);
            try {
                await axios.post(`${API_URL}/student/resume/upload`, formData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                alert('Resume uploaded successfully!');
                this.showResumeUpload = false;
                this.selectedFile = null;
                this.loadProfile();
            } catch (err) {
                alert(err.response?.data?.error || 'Failed to upload resume');
            }
        },
        renderStudentChart() {
            if (this.statusChart) this.statusChart.destroy();
            const ctx = document.getElementById('studentStatusChart');
            if (ctx) {
                this.statusChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Applied', 'Shortlisted', 'Selected', 'Rejected'],
                        datasets: [{
                            data: [
                                this.myApplications.filter(a => a.status === 'applied').length,
                                this.myApplications.filter(a => a.status === 'shortlisted').length,
                                this.myApplications.filter(a => a.status === 'selected').length,
                                this.myApplications.filter(a => a.status === 'rejected').length
                            ],
                            backgroundColor: ['#06b6d4', '#f59e0b', '#10b981', '#ef4444']
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
                this.$nextTick(() => this.renderStudentChart());
            }
        }
    }
};
