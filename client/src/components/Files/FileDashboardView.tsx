import React from 'react';
import VectorStoreSidePanel from './VectorStore/VectorStoreSidePanel';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../ui';

const FileDashboardView = () => {
  const params = useParams();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4 p-4 lg:p-7">
      <div className="flex flex-row items-center justify-between">
        {params.vectorStoreId && (
          <Button
            className="lg:hidden"
            variant={'outline'}
            size={'sm'}
            onClick={() => {
              navigate('/d');
            }}
          >
            Go back
          </Button>
        )}
      </div>
      <div className="flex flex-1 flex-col divide-y lg:flex-row lg:divide-x lg:divide-y-0">
        <div className={`flex-1 lg:w-1/3 ${params.vectorStoreId ? 'hidden lg:flex' : 'flex'}`}>
          <VectorStoreSidePanel />
        </div>
        <div className={`flex-1 lg:w-2/3 ${params.vectorStoreId ? 'flex' : 'hidden lg:flex'}`}>
          <div className="m-2 overflow-x-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDashboardView;
