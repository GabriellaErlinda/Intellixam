import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../../api'; // Adjust path as needed
import Papa from 'papaparse'; // For CSV parsing
import * as XLSX from 'xlsx'; // For XLSX parsing and generation
import {
    Box,Button,Typography,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,Paper,IconButton,CircularProgress,Alert,
    Dialog,DialogActions,DialogContent,DialogContentText,DialogTitle,TextField,Tooltip,List,ListItem,
    ListItemText,ListItemSecondaryAction,Select,MenuItem,FormControl,InputLabel,InputAdornment,
    useTheme, // Import useTheme
    Menu, // For template dropdown
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    GroupAdd as GroupAddIcon,
    PersonRemove as PersonRemoveIcon,
    Search as SearchIcon,
    UploadFile as UploadFileIcon, // For Import button
    InfoOutlined as InfoOutlinedIcon, // For tooltip on import
    // ArrowDropDownIcon, // Optional for template button
} from '@mui/icons-material';

function UserManagement() {
    const [groups, setGroups] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupToEdit, setGroupToEdit] = useState(null);
    const [groupToDelete, setGroupToDelete] = useState(null);
    const [studentToRemove, setStudentToRemove] = useState(null);

    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // For single actions
    const [isImporting, setIsImporting] = useState(false); // For bulk import
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);

    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [studentToAdd, setStudentToAdd] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const theme = useTheme();

    // For Template download menu
    const [templateMenuAnchorEl, setTemplateMenuAnchorEl] = useState(null);
    const classImportFileInputRef = useRef(null);
    const [importError, setImportError] = useState(null);
    const [importSuccess, setImportSuccess] = useState(null);


    // --- Data Fetching ---
    const fetchGroups = useCallback(async () => {
        setIsLoadingGroups(true);
        setError('');
        try {
            const response = await apiClient.get('/admin/usergroups');
            setGroups(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch user groups.');
            setGroups([]);
        } finally {
            setIsLoadingGroups(false);
        }
    }, []);

    const fetchAvailableStudents = useCallback(async () => {
        try {
            const response = await apiClient.get('/admin/students');
            setAvailableStudents(response.data || []);
        } catch (err) {
            if (!error) { // Avoid overwriting more critical errors
                setError(err.response?.data?.message || err.message || 'Failed to fetch available students.');
            }
            setAvailableStudents([]);
        }
    }, [error]); // Add error dependency

    const fetchGroupDetails = useCallback(async (groupId) => {
        if (!groupId) return;
        setIsLoadingDetails(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await apiClient.get(`/admin/usergroups/${groupId}`);
            setSelectedGroup(response.data);
            setShowDetailsModal(true);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch group details.');
            setSelectedGroup(null);
            setShowDetailsModal(false);
        } finally {
            setIsLoadingDetails(false);
        }
    }, []);

    useEffect(() => {
        fetchGroups();
        fetchAvailableStudents();
    }, [fetchGroups, fetchAvailableStudents]);

    // --- Utility Functions ---
    const clearMessages = () => {
         setError('');
         setSuccessMessage('');
         setImportError(null);
         setImportSuccess(null);
    };

    const handleOpenCreateModal = () => {
        clearMessages();
        setNewGroupName('');
        setNewGroupDesc('');
        setShowCreateModal(true);
    };
    const handleCloseCreateModal = () => { setShowCreateModal(false); setError('');}
    const handleOpenEditModal = (group) => {
        clearMessages();
        setGroupToEdit(group);
        setNewGroupName(group.name);
        setNewGroupDesc(group.description || '');
        setShowEditModal(true);
    };
    const handleCloseEditModal = () => {setShowEditModal(false); setGroupToEdit(null); setNewGroupName(''); setNewGroupDesc(''); setError('');}
    const handleOpenDetailsModal = (group) => { clearMessages(); fetchGroupDetails(group.id); };
    const handleCloseDetailsModal = () => { setShowDetailsModal(false); setSelectedGroup(null);};
    const handleOpenAddStudentModal = () => {
        if (!selectedGroup) return;
        setError(''); // Clear specific modal error
        setStudentToAdd('');
        setShowAddStudentModal(true);
    };
    const handleCloseAddStudentModal = () => {setShowAddStudentModal(false); setError('');}
    const openDeleteConfirm = (group) => { clearMessages(); setGroupToDelete(group);};
    const closeDeleteConfirm = () => {setGroupToDelete(null); setError('');}
    const openRemoveStudentConfirm = (student) => { setError(''); setStudentToRemove(student);};
    const closeRemoveStudentConfirm = () => {setStudentToRemove(null); setError('');}

    // --- Template Download Handlers ---
    const handleTemplateMenuOpen = (event) => {
        setTemplateMenuAnchorEl(event.currentTarget);
    };
    const handleTemplateMenuClose = () => {
        setTemplateMenuAnchorEl(null);
    };
    const handleDownloadClassTemplate = (format) => {
        const headers = ['Class name', 'Username']; // Exact headers for the template
        const filename = `class_students_template`;

        if (format === 'csv') {
            const csvContent = headers.join(",") + "\n" + "Example Class A,studentuser1\nExample Class A,studentuser2\nExample Class B,studentuser3";
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${filename}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else if (format === 'xlsx') {
            const worksheetData = [
                headers,
                ["Example Class A", "studentuser1"],
                ["Example Class A", "studentuser2"],
                ["Example Class B", "studentuser3"]
            ];
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
            XLSX.writeFile(workbook, `${filename}.xlsx`);
        }
        handleTemplateMenuClose();
    };

    // --- Class Import Handlers ---
    const handleImportClassClick = () => {
        clearMessages();
        classImportFileInputRef.current?.click();
    };

    const processClassImportData = async (parsedData) => {
        setIsImporting(true);
        setImportError(null);
        setImportSuccess(null);

        let classesCreatedCount = 0;
        let studentsAddedCount = 0;
        let rowErrors = [];
        let processedClassNames = new Map(); // To store ID of newly created or found classes during this import

        // Helper to get or create class and store its ID
        const getOrCreateClass = async (className, localGroups, localAvailableStudents) => {
            if (processedClassNames.has(className.toLowerCase())) {
                return processedClassNames.get(className.toLowerCase());
            }
            let group = localGroups.find(g => g.name.toLowerCase() === className.toLowerCase());
            if (group) {
                processedClassNames.set(className.toLowerCase(), group.id);
                return group.id;
            }
            try {
                const response = await apiClient.post('/admin/usergroups', { name: className, description: '' });
                const newGroup = response.data;
                classesCreatedCount++;
                setGroups(prev => [...prev, newGroup]); // Update global state
                processedClassNames.set(className.toLowerCase(), newGroup.id);
                return newGroup.id;
            } catch (err) {
                throw new Error(`Failed to create class "${className}": ${err.response?.data?.message || err.message}`);
            }
        };

        // Helper to find student
        const findStudentId = (username, localAvailableStudents) => {
            const student = localAvailableStudents.find(s => s.username.toLowerCase() === username.toLowerCase());
            return student ? student.id : null;
        };

        for (let i = 0; i < parsedData.length; i++) {
            const row = parsedData[i];
            const rowNum = i + 1; // 1-based for error messages

            const className = row['Class name']?.trim();
            const username = row['Username']?.trim();

            if (!className || !username) {
                rowErrors.push(`Row ${rowNum}: Missing "Class name" or "Username". Skipping.`);
                continue;
            }

            try {
                const studentId = findStudentId(username, availableStudents); // Use current availableStudents state
                if (!studentId) {
                    rowErrors.push(`Row ${rowNum}: Student "${username}" not found. Skipping.`);
                    continue;
                }

                // Get current groups state for class lookup within the loop
                let currentGroups = [];
                setGroups(g => { currentGroups = g; return g; }); // Read current groups state

                const classId = await getOrCreateClass(className, currentGroups, availableStudents);

                // Add student to class
                try {
                    const addStudentResponse = await apiClient.post(`/admin/usergroups/${classId}/students`, { student_id: studentId });
                    const updatedGroupData = addStudentResponse.data.group;

                    // Update the specific group in the main 'groups' state
                    setGroups(prevGroups => prevGroups.map(g => g.id === classId ? updatedGroupData : g));

                    // If this class is currently being viewed in details modal, update it
                    if (selectedGroup && selectedGroup.id === classId) {
                        setSelectedGroup(updatedGroupData);
                    }
                    studentsAddedCount++;

                } catch (addErr) {
                    // Handle student already in group, or other errors
                    const errMsg = addErr.response?.data?.message || addErr.message;
                    if (errMsg.toLowerCase().includes('student is already a member')) {
                        // Optionally count as success or just note it
                        rowErrors.push(`Row ${rowNum}: Student "${username}" already in class "${className}".`);
                    } else {
                        rowErrors.push(`Row ${rowNum}: Failed to add student "${username}" to "${className}": ${errMsg}.`);
                    }
                }
            } catch (classErr) {
                rowErrors.push(`Row ${rowNum}: Error processing class "${className}": ${classErr.message}.`);
            }
        } // end for loop

        let summaryMessage = "";
        if (classesCreatedCount > 0) summaryMessage += `${classesCreatedCount} new class(es) created. `;
        if (studentsAddedCount > 0) summaryMessage += `${studentsAddedCount} student(s) added to classes. `;

        if (summaryMessage) setImportSuccess(summaryMessage.trim());
        if (rowErrors.length > 0) {
            const errorMsg = `Import completed with ${rowErrors.length} issue(s). First few issues:\n${rowErrors.slice(0, 5).join('\n')}`;
            setImportError(errorMsg);
            if (!summaryMessage) setImportSuccess(null); // If only errors, no success message
        } else if (!summaryMessage && parsedData.length > 0) {
             setImportError("No changes made. Data might be invalid or already up-to-date.");
        } else if (parsedData.length === 0) {
            setImportError("The file had no data rows to process.");
        }


        setIsImporting(false);
        if (classImportFileInputRef.current) classImportFileInputRef.current.value = null;
    };

    const handleClassFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        clearMessages();

        const fileName = file.name.toLowerCase();
        const isCsv = file.type.includes('csv') || fileName.endsWith('.csv');
        const isXlsx = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

        if (!isCsv && !isXlsx) {
            setImportError('Invalid file type. Please upload a CSV or XLSX file.');
            if (classImportFileInputRef.current) classImportFileInputRef.current.value = null;
            return;
        }

        const expectedHeaders = ['class name', 'username']; // Lowercase for comparison

        const parseAndProcess = (data, fileHeaders) => {
            const actualHeadersLower = fileHeaders.map(h => String(h).toLowerCase().trim());
            const missingHeaders = expectedHeaders.filter(eh => !actualHeadersLower.includes(eh));

            if (missingHeaders.length > 0) {
                setImportError(`File is missing required columns: ${missingHeaders.join(', ')}. Expected "Class name" and "Username".`);
                setImportSuccess(null);
                if (classImportFileInputRef.current) classImportFileInputRef.current.value = null;
                return;
            }
            // Re-map data to use consistent keys based on expectedHeaders (case-insensitive)
            const mappedData = data.map(row => {
                const newRow = {};
                const rowKeysLower = Object.keys(row).map(k => String(k).toLowerCase().trim());

                const classNameKey = Object.keys(row)[rowKeysLower.findIndex(k => k === 'class name')];
                const usernameKey = Object.keys(row)[rowKeysLower.findIndex(k => k === 'username')];

                if (classNameKey) newRow['Class name'] = row[classNameKey];
                if (usernameKey) newRow['Username'] = row[usernameKey];
                return newRow;
            });
            processClassImportData(mappedData);
        };


        if (isCsv) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        setImportError(`CSV parsing error: ${results.errors[0].message}`);
                        return;
                    }
                    const fileHeaders = results.meta?.fields || (results.data.length > 0 ? Object.keys(results.data[0]) : []);
                    parseAndProcess(results.data, fileHeaders);
                },
                error: (error) => {
                    setImportError(`Error parsing CSV: ${error.message}`);
                    if (classImportFileInputRef.current) classImportFileInputRef.current.value = null;
                },
            });
        } else if (isXlsx) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const fileData = e.target.result;
                    const workbook = XLSX.read(fileData, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    if (!sheetName) { setImportError('XLSX file is empty or has no sheets.'); return; }
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

                    if (jsonData.length < 1) { setImportError('XLSX sheet has no header row.'); return; }
                    const fileHeaders = jsonData[0].map(h => String(h));
                    const dataRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // header: 0 (default)

                    parseAndProcess(dataRows, fileHeaders);
                } catch (xlsxError) {
                    setImportError(`Error processing XLSX: ${xlsxError.message}`);
                    if (classImportFileInputRef.current) classImportFileInputRef.current.value = null;
                }
            };
            reader.onerror = () => { setImportError('Error reading XLSX file.'); if (classImportFileInputRef.current) classImportFileInputRef.current.value = null; };
            reader.readAsArrayBuffer(file);
        }
    };


    // --- API Actions (Create, Update, Delete Group, Add/Remove Student) ---
    // (These functions remain largely the same, but ensure they clear import messages)
    const handleCreateGroup = async (event) => {
        event.preventDefault();
        if (!newGroupName.trim()) { setError('Class name cannot be empty.'); return; }
        setIsSubmitting(true); setError(''); setSuccessMessage(''); setImportError(null); setImportSuccess(null);
        try {
            const response = await apiClient.post('/admin/usergroups', { name: newGroupName.trim(), description: newGroupDesc.trim() });
            const newGroupData = response.data;
            setGroups(prevGroups => [...prevGroups, newGroupData]);
            setSuccessMessage(`Class '${newGroupData.name}' created successfully.`);
            handleCloseCreateModal();
        } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to create class.'); }
        finally { setIsSubmitting(false); }
    };

    const handleUpdateGroup = async (event) => {
        event.preventDefault();
        if (!groupToEdit || !newGroupName.trim()) { setError('Class name cannot be empty.'); return; }
        setIsSubmitting(true); setError(''); setSuccessMessage(''); setImportError(null); setImportSuccess(null);
        try {
            const response = await apiClient.put(`/admin/usergroups/${groupToEdit.id}`, { name: newGroupName.trim(), description: newGroupDesc.trim() });
            const updatedGroupData = response.data;
            setSuccessMessage(`Class '${updatedGroupData.name}' updated successfully.`);
            handleCloseEditModal();
            setGroups(currentGroups => currentGroups.map(grp => grp.id === updatedGroupData.id ? updatedGroupData : grp));
            if (selectedGroup && selectedGroup.id === groupToEdit.id) { setSelectedGroup(updatedGroupData); }
        } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to update class.'); }
        finally { setIsSubmitting(false); }
    };

    const handleDeleteGroup = async () => {
        if (!groupToDelete) return;
        setIsSubmitting(true); setError(''); setSuccessMessage(''); setImportError(null); setImportSuccess(null);
        try {
            await apiClient.delete(`/admin/usergroups/${groupToDelete.id}`);
            const deletedGroupName = groupToDelete.name;
            const deletedGroupId = groupToDelete.id;
            setSuccessMessage(`Class '${deletedGroupName}' deleted successfully.`);
            closeDeleteConfirm();
            setGroups(currentGroups => currentGroups.filter(grp => grp.id !== deletedGroupId));
            if (selectedGroup && selectedGroup.id === deletedGroupId) { handleCloseDetailsModal(); }
        } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to delete class.'); }
        finally { setIsSubmitting(false); }
    };

    const handleAddStudent = async (event) => {
        event.preventDefault();
        if (!selectedGroup || !studentToAdd) { setError('Please select a student to add.'); return; }
        setIsSubmitting(true); setError(''); setSuccessMessage(''); setImportError(null); setImportSuccess(null);
        try {
            const response = await apiClient.post(`/admin/usergroups/${selectedGroup.id}/students`, { student_id: studentToAdd });
            const updatedGroupData = response.data.group;
            setSuccessMessage(response.data.message || 'Student added successfully.');
            setSelectedGroup(updatedGroupData);
            setGroups(currentGroups => currentGroups.map(grp => grp.id === updatedGroupData.id ? updatedGroupData : grp));
            handleCloseAddStudentModal();
        } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to add student to class.'); }
        finally { setIsSubmitting(false); }
    };

    const handleRemoveStudent = async () => {
        if (!selectedGroup || !studentToRemove) return;
        setIsSubmitting(true); setError(''); setSuccessMessage(''); setImportError(null); setImportSuccess(null);
        try {
            const response = await apiClient.delete(`/admin/usergroups/${selectedGroup.id}/students/${studentToRemove.id}`);
            const updatedGroupData = response.data.group;
            setSuccessMessage(response.data.message || 'Student removed successfully.');
            setSelectedGroup(updatedGroupData);
            setGroups(currentGroups => currentGroups.map(grp => grp.id === updatedGroupData.id ? updatedGroupData : grp));
            closeRemoveStudentConfirm();
        } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to remove student from class.'); }
        finally { setIsSubmitting(false); }
    };

    // --- Filtering Logic ---
    const displayedGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const studentsAvailableToAdd = availableStudents.filter(student =>
        !selectedGroup?.students?.some(member => member.id === student.id)
    );

    // --- Render ---
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom> Class Management </Typography>

            {/* Import Status Messages */}
            {importSuccess && <Alert severity="success" onClose={() => setImportSuccess(null)} sx={{ mb: 2 }}>{importSuccess}</Alert>}
            {importError && <Alert severity="error" onClose={() => setImportError(null)} sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{importError}</Alert>}


             {successMessage && !showDetailsModal && !importSuccess && ( <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 2 }}>{successMessage}</Alert> )}
             {error && !showCreateModal && !showEditModal && !showDetailsModal && !showAddStudentModal && !groupToDelete && !studentToRemove && !importError &&(
                <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>
            )}


            <Paper elevation={0} sx={{ p: theme.spacing(1.5), mb: theme.spacing(3), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius, }}>
                 <TextField
                    variant="outlined" size="small" placeholder="Search class..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>), sx: { borderRadius: '10px', bgcolor: theme.palette.background.paper, } }}
                    sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 200 }, mr: {sm: 2} }} aria-label="Search class"
                 />
                 <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end'}, width: {xs: '100%', sm: 'auto'} }}>
                    {/* Template Button */}
                    <Button
                        variant="outlined"
                        onClick={handleTemplateMenuOpen}
                        disabled={isSubmitting || isImporting}
                        size="medium"
                        sx={{ borderRadius: '10px', textTransform: 'none' }}
                    >
                        Template
                    </Button>
                    <Menu
                        id="class-template-menu"
                        anchorEl={templateMenuAnchorEl}
                        open={Boolean(templateMenuAnchorEl)}
                        onClose={handleTemplateMenuClose}
                    >
                        <MenuItem onClick={() => handleDownloadClassTemplate('csv')}>Download CSV Template</MenuItem>
                        <MenuItem onClick={() => handleDownloadClassTemplate('xlsx')}>Download XLSX Template</MenuItem>
                    </Menu>

                    {/* Hidden File Input for Class Import */}
                    <input
                        type="file"
                        ref={classImportFileInputRef}
                        onChange={handleClassFileChange}
                        style={{ display: 'none' }}
                        accept=".csv,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    />
                    {/* Import Class Button */}
                    <Tooltip title={<span>Import classes and assign students from CSV/XLSX.<br />Required headers: <b>Class name, Username</b></span>}>
                        <Button
                            variant="outlined"
                            startIcon={<UploadFileIcon />}
                            onClick={handleImportClassClick}
                            disabled={isSubmitting || isImporting}
                            size="medium"
                            sx={{ borderRadius: '10px', textTransform: 'none' }}
                        >
                            Import Class{isImporting && <CircularProgress size={20} sx={{ml:1}}/>}
                            <InfoOutlinedIcon fontSize='inherit' sx={{ ml: 0.5, verticalAlign: 'middle', opacity: 0.7 }} />
                        </Button>
                    </Tooltip>

                    {/* New Class Button */}
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateModal} sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none' }} disabled={isSubmitting || isImporting}>
                        New Class
                    </Button>
                 </Box>
            </Paper>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="class table">
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: 'action.hover' } }}>
                            <TableCell>Class Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Students</TableCell>
                            <TableCell align="center">View Students</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoadingGroups ? (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
                        ) : displayedGroups.length === 0 && !error ? (
                             <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                {searchTerm ? `No class found matching "${searchTerm}".` : 'No class found. Create one or import to get started.'}
                             </TableCell></TableRow>
                        ): (
                            displayedGroups.map((group) => (
                                <TableRow hover key={group.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell component="th" scope="row">{group.name}</TableCell>
                                    <TableCell>{group.description || '-'}</TableCell>
                                    <TableCell align="right">{group.students?.length ?? group.student_count ?? 'N/A'}</TableCell> {/* Prioritize live students length */}
                                    <TableCell align="center">
                                        <Button variant="outlined" size="small" onClick={() => handleOpenDetailsModal(group)} disabled={isSubmitting || isImporting}><VisibilityIcon fontSize="small" sx={{mr:0.5}}/>View</Button>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Edit Class"><IconButton onClick={() => handleOpenEditModal(group)} color="secondary" size="small" disabled={isSubmitting || isImporting}><EditIcon fontSize="small"/></IconButton></Tooltip>
                                        <Tooltip title="Delete Class"><IconButton onClick={() => openDeleteConfirm(group)} color="error" size="small" disabled={isSubmitting || isImporting}><DeleteIcon fontSize="small"/></IconButton></Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                         {error && !isLoadingGroups && groups.length === 0 && (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'error.main' }}>{`Error loading groups: ${error}`}</TableCell></TableRow>
                         )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- Modals --- */}
            {/* Create Group Modal */}
            <Dialog open={showCreateModal} onClose={handleCloseCreateModal} >
                <DialogTitle>Create New Class</DialogTitle>
                <Box component="form" onSubmit={handleCreateGroup}>
                    <DialogContent>
                        <TextField autoFocus margin="dense" id="new-group-name" label="Class Name" type="text" fullWidth variant="outlined" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required sx={{ mb: 2 }} error={!!error && error.includes('name')} helperText={error && error.includes('name') ? error : ''} />
                        <TextField margin="dense" id="new-group-desc" label="Description (Optional)" type="text" fullWidth multiline rows={3} variant="outlined" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
                         {error && !error.includes('name') && <Alert severity="error" sx={{mt: 2}}>{error}</Alert>}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={handleCloseCreateModal} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting}> {isSubmitting ? <CircularProgress size={24} /> : 'Create'} </Button>
                    </DialogActions>
                </Box>
            </Dialog>

             {/* Edit Group Modal */}
            <Dialog open={showEditModal} onClose={handleCloseEditModal}>
                <DialogTitle>Edit Class: {groupToEdit?.name}</DialogTitle>
                 <Box component="form" onSubmit={handleUpdateGroup}>
                    <DialogContent>
                        <TextField autoFocus margin="dense" id="edit-group-name" label="Group Name" type="text" fullWidth variant="outlined" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required sx={{ mb: 2 }} error={!!error && error.includes('name')} helperText={error && error.includes('name') ? error : ''}/>
                        <TextField margin="dense" id="edit-group-desc" label="Description (Optional)" type="text" fullWidth multiline rows={3} variant="outlined" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
                         {error && !error.includes('name') && <Alert severity="error" sx={{mt: 2}}>{error}</Alert>}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={handleCloseEditModal} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting}> {isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'} </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* View Details & Members Modal */}
            <Dialog open={showDetailsModal} onClose={handleCloseDetailsModal} fullWidth maxWidth="sm">
                 <DialogTitle>Class Details: {selectedGroup?.name}</DialogTitle>
                <DialogContent>
                     {isLoadingDetails ? ( <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
                    ) : selectedGroup ? ( <Box>
                            <Typography variant="body1" gutterBottom> <strong>Description:</strong> {selectedGroup.description || <em>No description provided.</em>} </Typography>
                            <Typography variant="body1" gutterBottom> <strong>Created:</strong> {selectedGroup.created_at ? new Date(selectedGroup.created_at).toLocaleString() : 'N/A'} </Typography>
                            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}> Students ({selectedGroup.students?.length || 0}) </Typography>

                            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
                            {successMessage && <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 2 }}>{successMessage}</Alert>}

                            <Button variant="outlined" size="small" startIcon={<GroupAddIcon />} onClick={handleOpenAddStudentModal} sx={{ mb: 1 }} disabled={isSubmitting || studentsAvailableToAdd.length === 0 || isImporting} > Add Student </Button>

                            {selectedGroup.students && selectedGroup.students.length > 0 ? ( <Paper variant="outlined" sx={{ maxHeight: 250, overflow: 'auto' }}> <List dense> {selectedGroup.students.map((student) => ( <ListItem key={student.id} divider> <ListItemText primary={student.username} secondary={`ID: ${student.id}`} /> <ListItemSecondaryAction> <Tooltip title="Remove Student"> <IconButton edge="end" aria-label="remove" color="error" size="small" onClick={() => openRemoveStudentConfirm(student)} disabled={isSubmitting || isImporting} > <PersonRemoveIcon fontSize='small'/> </IconButton> </Tooltip> </ListItemSecondaryAction> </ListItem> ))} </List> </Paper>
                            ) : ( <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}> No students currently in this class. </Typography> )}
                        </Box>
                    ) : (
                         <Typography color="error">{error || 'Could not load group details.'}</Typography>
                    )}
                </DialogContent>
                 <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseDetailsModal} disabled={isLoadingDetails || isSubmitting || isImporting}>Close</Button>
                </DialogActions>
            </Dialog>

             {/* Add Student Modal */}
             <Dialog open={showAddStudentModal} onClose={handleCloseAddStudentModal}>
                 <DialogTitle>Add Student to Class: {selectedGroup?.name}</DialogTitle>
                 <Box component="form" onSubmit={handleAddStudent}>
                    <DialogContent sx={{minWidth: 300}}>
                        <FormControl fullWidth margin="dense" required error={!!error}>
                            <InputLabel id="select-student-label">Select Student</InputLabel>
                            <Select labelId="select-student-label" id="select-student" value={studentToAdd} label="Select Student" onChange={(e) => setStudentToAdd(e.target.value)} disabled={studentsAvailableToAdd.length === 0 || isSubmitting} >
                                <MenuItem value="" disabled> <em>-- Select a student --</em> </MenuItem>
                                {studentsAvailableToAdd.length > 0 ? ( studentsAvailableToAdd.map((student) => ( <MenuItem key={student.id} value={student.id}> {student.username} (ID: {student.id}) </MenuItem> ))
                                ) : ( <MenuItem value="" disabled> <em>All available students are in this class or no students available.</em> </MenuItem> )}
                            </Select>
                             {error && <DialogContentText color="error" sx={{mt: 1}}>{error}</DialogContentText>}
                        </FormControl>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                         <Button onClick={handleCloseAddStudentModal} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting || !studentToAdd || studentsAvailableToAdd.length === 0} > {isSubmitting ? <CircularProgress size={24} /> : 'Add Student'} </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Delete Group Confirmation Dialog */}
            <Dialog open={Boolean(groupToDelete)} onClose={closeDeleteConfirm} >
                <DialogTitle> Confirm Deletion </DialogTitle>
                <DialogContent>
                    <DialogContentText> Are you sure you want to delete the class "{groupToDelete?.name}"? Students will be unassigned. This action cannot be undone. </DialogContentText>
                    {error && <Alert severity="error" sx={{mt: 2}}>{error}</Alert>}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeDeleteConfirm} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleDeleteGroup} color="error" autoFocus disabled={isSubmitting}> {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Delete'} </Button>
                </DialogActions>
            </Dialog>

             {/* Remove Student Confirmation Dialog */}
             <Dialog open={Boolean(studentToRemove)} onClose={closeRemoveStudentConfirm} >
                <DialogTitle>Confirm Removal</DialogTitle>
                <DialogContent>
                    <DialogContentText> Are you sure you want to remove student "{studentToRemove?.username}" from class "{selectedGroup?.name}"? </DialogContentText>
                    {error && <Alert severity="error" sx={{mt: 2}}>{error}</Alert>}
                 </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeRemoveStudentConfirm} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleRemoveStudent} color="error" autoFocus disabled={isSubmitting}> {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Remove'} </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default UserManagement;