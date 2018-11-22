call gulp deploy:app
call gulp deploy:backend
call gulp deploy:cf
cd public
cf login -u reto.lamprecht@gmx.ch -p G0ldmember -o ComicVM -s Development
cf push
