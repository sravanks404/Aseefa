import React, { useState, useEffect } from 'react';
import "./Login.css";
import api from '../apiService';
import { useNavigate } from 'react-router-dom';

const UserDetails = () => {
    const [user, setUser] = useState(null);
    const [docs, setDocs] = useState(null);
    const [designation, setDesignation] = useState(null);
    const [Dept, setDept] = useState(null);
    const [Role, setRole] = useState(null);
    const [loading, setLoading] = useState(true); 

    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const UserId = sessionStorage.getItem("UserId");
                const CompanyID = sessionStorage.getItem("CompanyID");
          
                const [userResponse, docsResponse] = await Promise.all([
                    api.get(`/api/getUserbyid?UserId=${UserId}`),
                    // api.get(`/api/getEmpdocbyid?UserId=${UserId}`)
                ]);

                setUser(userResponse.data.length > 0 ? userResponse.data[0] : {});
                // setDocs(docsResponse.data.length > 0 ? docsResponse.data : []);

                // if (docsResponse.data.length > 0 && docsResponse.data[0].DesignationId) {
                //     const designationResponse = await api.get(`/api/getdesigbydesigid/${docsResponse.data[0].DesignationId}`);
                //     console.log('Designation Response:', designationResponse.data); // Debugging line
                //     setDesignation(designationResponse.data || {});
                // }

                // if (docsResponse.data.length > 0 && docsResponse.data[0].DeptID) {
                //     const DeptResponse = await api.get(`/api/GetDepartmentByDeptID/${docsResponse.data[0].DeptID}`);
                //     console.log('Dept Response:', DeptResponse.data); 
                //     setDept(DeptResponse.data || {});
                // }

                // if (docsResponse.data.length > 0 && docsResponse.data[0].RoleId) {
                //     const RoleResponse = await api.get(`/api/GetRoleByRoleId/${docsResponse.data[0].RoleId}`);
                //     console.log('Role Response:', RoleResponse.data); 
                //     setRole(RoleResponse.data || {});
                // }
                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to fetch data');
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    const handleResetPassword = () => {
        navigate('/Resetpassword');
    };

    return (
        <div className="user-details">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-image">
                        {docs && docs.length > 0 && docs[0].Image ? (
                            <img src={`data:image/jpeg;base64,${docs[0].Image}`} alt="User" />
                        ) : (
                            <p>No Image available</p>
                        )}
                    </div>
                    <div className="profile-info">
                        <h2>{user.Name || 'No Name Available'}</h2>
                        <p className="role">{user.UserName || 'No Username Available'}</p>
                    </div>
                </div>
                <div className="profile-body">
                    <div className="info-section">
                        <h3>Address</h3>
                        <p>{user.Address1 ? `${user.Address1}, ${user.Address2}, ${user.Address3}` : 'No Address Available'}</p>
                    </div>
                    <div className="info-section">
                        <h3>Mobile</h3>
                        <p>{user.Mobile || 'No Mobile Available'}</p>
                    </div>
                    <div className="info-section">
                        <h3>Email</h3>
                        <p>{user.Email || 'No Email Available'}</p>
                    </div>
                    {/* <div className="info-section">
                        <h3>Department</h3>
                        <p>{Dept?.Dept || ' Department Not Assigned'}</p>
                    </div>
                    <div className="info-section">
                        <h3>Designation</h3>
                        <p>{designation?.Designation || ' Designation Not Assigned'}</p>
                    </div> */}
                    <div className="info-section">
                        <h3>User Role </h3>
                        <p>{user?.RoleName || ' Role Not Assigned'}</p>
                    </div>
                </div>
                {/* <button className="reset-password-button" onClick={handleResetPassword}>
                    Reset Password
                </button> */}
            </div>
        </div>
    );
};

export default UserDetails;
