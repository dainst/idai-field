/**
 * @author Daniel de Oliveira
 */
export interface EditNavigation {

    /**
     * @param savedViaSaveButton
     */
    navigate(savedViaSaveButton:boolean);

    discard(optional?:any);

    goBack();

    showModal();
}