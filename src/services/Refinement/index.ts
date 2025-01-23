import { 
  RefinementResponse,
  RefinementOriginCreate,
  RefinementOriginUpdateWithId,
  RefinementTransmissionCreate,
  RefinementTransmissionUpdateWithId,
  RefinementDatioCreate,
  RefinementDatioUpdateWithId,
  RefinementDefinitionCreate,
  RefinementDefinitionUpdateWithId,
  RefinementStagingCreate,
  RefinementStagingUpdateWithId,
  RefinementRawCreate,
  RefinementRawUpdateWithId,
  RefinementMasterCreate,
  RefinementMasterUpdateWithId
} from './types';
import { createFetcher } from '@/lib/api/fetcher';
import { API_CONFIG } from '@/lib/api/config';

async function getRefinementByObjectId(objectId: string, user: string, country: string): Promise<RefinementResponse | null> {
  const fetcher = createFetcher(user, country);
  try {
    const response = await fetcher(`${API_CONFIG.BASE_URL}/refinements/object/${objectId}`);
    if (!response) return null;
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return null;
    }
    console.error('Error al obtener refinamiento:', error);
    throw error;
  }
}

// Origin
async function createOriginRefinement(data: RefinementOriginCreate, user: string, country: string): Promise<RefinementResponse> {
  const fetcher = createFetcher(user, country);
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/refinements/origin`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error: unknown) {
    console.error('Error al crear refinamiento de origen:', error);
    throw error;
  }
}

async function updateOriginRefinement(data: RefinementOriginUpdateWithId, user: string, country: string): Promise<RefinementResponse> {
  const fetcher = createFetcher(user, country);
  try {
    const { id_refinement, ...updateData } = data;
    return await fetcher(`${API_CONFIG.BASE_URL}/refinements/${id_refinement}/origin`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Refinamiento no encontrado');
    }
    console.error('Error al actualizar refinamiento de origen:', error);
    throw error;
  }
}

// Transmission
async function createTransmissionRefinement(data: RefinementTransmissionCreate, user: string, country: string): Promise<RefinementResponse> {
  const fetcher = createFetcher(user, country);
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/refinements/transmission`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error: unknown) {
    console.error('Error al crear refinamiento de transmisión:', error);
    throw error;
  }
}

async function updateTransmissionRefinement(data: RefinementTransmissionUpdateWithId, user: string, country: string): Promise<RefinementResponse> {
  const fetcher = createFetcher(user, country);
  try {
    const { id_refinement, ...updateData } = data;
    return await fetcher(`${API_CONFIG.BASE_URL}/refinements/${id_refinement}/transmission`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Refinamiento no encontrado');
    }
    console.error('Error al actualizar refinamiento de transmisión:', error);
    throw error;
  }
}

// Datio
async function createDatioRefinement(data: RefinementDatioCreate, user: string, country: string): Promise<RefinementResponse> {
  const fetcher = createFetcher(user, country);
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/refinements/datio`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error: unknown) {
    console.error('Error al crear refinamiento de datio:', error);
    throw error;
  }
}

async function updateDatioRefinement(data: RefinementDatioUpdateWithId, user: string, country: string): Promise<RefinementResponse> {
  const fetcher = createFetcher(user, country);
  try {
    const { id_refinement, ...updateData } = data;
    return await fetcher(`${API_CONFIG.BASE_URL}/refinements/${id_refinement}/datio`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Refinamiento no encontrado');
    }
    console.error('Error al actualizar refinamiento de datio:', error);
    throw error;
  }
}

// Definition
async function createDefinitionRefinement(data: RefinementDefinitionCreate, user: string, country: string): Promise<RefinementResponse> {
  const fetcher = createFetcher(user, country);
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/refinements/definition`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error: unknown) {
    console.error('Error al crear refinamiento de definición:', error);
    throw error;
  }
}

async function updateDefinitionRefinement(data: RefinementDefinitionUpdateWithId, user: string, country: string): Promise<RefinementResponse> {
  const fetcher = createFetcher(user, country);
  try {
    const { id_refinement, ...updateData } = data;
    return await fetcher(`${API_CONFIG.BASE_URL}/refinements/${id_refinement}/definition`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Refinamiento no encontrado');
    }
    console.error('Error al actualizar refinamiento de definición:', error);
    throw error;
  }
}

// Staging
async function createStagingRefinement(data: RefinementStagingCreate, user: string, country: string): Promise<RefinementResponse> {
  const fetcher = createFetcher(user, country);
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/refinements/staging`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error: unknown) {
    console.error('Error al crear refinamiento de staging:', error);
    throw error;
  }
}

async function updateStagingRefinement(data: RefinementStagingUpdateWithId, user: string, country: string): Promise<RefinementResponse> {
  const fetcher = createFetcher(user, country);
  try {
    const { id_refinement, ...updateData } = data;
    return await fetcher(`${API_CONFIG.BASE_URL}/refinements/${id_refinement}/staging`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Refinamiento no encontrado');
    }
    console.error('Error al actualizar refinamiento de staging:', error);
    throw error;
  }
}

// Raw
async function createRawRefinement(data: RefinementRawCreate, user: string, country: string): Promise<RefinementResponse> {
  const fetcher = createFetcher(user, country);
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/refinements/raw`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error: unknown) {
    console.error('Error al crear refinamiento raw:', error);
    throw error;
  }
}

async function updateRawRefinement(data: RefinementRawUpdateWithId, user: string, country: string): Promise<RefinementResponse> {
  const fetcher = createFetcher(user, country);
  try {
    const { id_refinement, ...updateData } = data;
    return await fetcher(`${API_CONFIG.BASE_URL}/refinements/${id_refinement}/raw`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Refinamiento no encontrado');
    }
    console.error('Error al actualizar refinamiento raw:', error);
    throw error;
  }
}

// Master
async function createMasterRefinement(data: RefinementMasterCreate, user: string, country: string): Promise<RefinementResponse> {
  const fetcher = createFetcher(user, country);
  try {
    return await fetcher(`${API_CONFIG.BASE_URL}/refinements/master`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error: unknown) {
    console.error('Error al crear refinamiento master:', error);
    throw error;
  }
}

async function updateMasterRefinement(data: RefinementMasterUpdateWithId, user: string, country: string): Promise<RefinementResponse> {
  const fetcher = createFetcher(user, country);
  try {
    const { id_refinement, ...updateData } = data;
    return await fetcher(`${API_CONFIG.BASE_URL}/refinements/${id_refinement}/master`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error('Refinamiento no encontrado');
    }
    console.error('Error al actualizar refinamiento master:', error);
    throw error;
  }
}

// Delete refinement
async function deleteRefinement(id: string, user: string, country: string): Promise<void> {
  const fetcher = createFetcher(user, country);
  try {
    await fetcher(`${API_CONFIG.BASE_URL}/refinements/${id}`, {
      method: 'DELETE'
    });
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 404) {
      return;
    }
    console.error('Error al eliminar refinamiento:', error);
    throw error;
  }
}

export {
  getRefinementByObjectId,
  createOriginRefinement,
  updateOriginRefinement,
  createTransmissionRefinement,
  updateTransmissionRefinement,
  createDatioRefinement,
  updateDatioRefinement,
  createDefinitionRefinement,
  updateDefinitionRefinement,
  createStagingRefinement,
  updateStagingRefinement,
  createRawRefinement,
  updateRawRefinement,
  createMasterRefinement,
  updateMasterRefinement,
  deleteRefinement
}; 