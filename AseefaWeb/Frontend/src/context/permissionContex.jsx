// import React, { createContext, useContext, useState } from "react";
// import api from "../../pages/apiService";
// const PermissionContext = createContext();
// export const PermissionProvider = ({ children }) => {
//     const [permissions, setPermissions] = useState(() => {
//         const data = sessionStorage.getItem("permissions");
//         return data ? JSON.parse(data) : [];
//     });
//     const savePermissions = (data) => {
//         setPermissions(data);
//         sessionStorage.setItem("permissions", JSON.stringify(data));
//     };
//     const clearPermissions = () => {
//         setPermissions([]);
//         sessionStorage.removeItem("permissions");
//     };
//     // NEW
//     const refreshPermissions = async () => {
//         const userId = sessionStorage.getItem("UserId");
//         if (!userId) return;
//         try {
//             const res = await api.get(
//                 `/api/getUserPermission?UserID=${userId}`
//             );
//             savePermissions(res.data.data || []);
//         } catch (err) {
//             console.error("Permission refresh failed:", err);
//         }
//     };
//     const getPermission = (formCode) => {
//         return (
//             permissions.find(p => p.FormCode === formCode) || {
//                 CanView: false,
//                 CanAdd: false,
//                 CanEdit: false,
//                 CanDelete: false,
//                 CanPrint: false,
//                 CanExport: false,
//                 CanApprove: false
//             }
//         );
//     };
//     return (
//         <PermissionContext.Provider
//             value={{
//                 permissions,
//                 savePermissions,
//                 clearPermissions,
//                 refreshPermissions, // NEW
//                 getPermission
//             }}
//         >
//             {children}
//         </PermissionContext.Provider>
//     );
// };
// export const usePermission = () => useContext(PermissionContext);
import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import api from "../../pages/apiService";

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
    const [permissions, setPermissions] = useState(() => {
        try {
            const data = sessionStorage.getItem("permissions");
            return (data && data !== "undefined") ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    });

    const savePermissions = useCallback((data) => {
        setPermissions(data);
        sessionStorage.setItem("permissions", JSON.stringify(data));
    }, []);

    const clearPermissions = useCallback(() => {
        setPermissions([]);
        sessionStorage.removeItem("permissions");
    }, []);

    // NEW
    const refreshPermissions = useCallback(async () => {
        const userId = sessionStorage.getItem("UserId");
        if (!userId) return;
        try {
            const res = await api.get(
                `/api/getUserPermission?UserID=${userId}`
            );
            savePermissions(res.data.data || []);
        } catch (err) {
            console.error("Permission refresh failed:", err);
        }
    }, [savePermissions]);

    const getPermission = useCallback((formCode) => {
        return (
            permissions.find(p => p.FormCode === formCode) || {
                CanView: false,
                CanAdd: false,
                CanEdit: false,
                CanDelete: false,
                CanPrint: false,
                CanExport: false,
                CanApprove: false
            }
        );
    }, [permissions]);

    const value = useMemo(() => ({
        permissions,
        savePermissions,
        clearPermissions,
        refreshPermissions, // NEW
        getPermission
    }), [permissions, savePermissions, clearPermissions, refreshPermissions, getPermission]);

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
};

export const usePermission = () => useContext(PermissionContext);