#!/usr/bin/env bash
# .platform/hooks/postdeploy/00_get_certificate.sh
sudo certbot -n -d ava-02.us-east-1.elasticbeanstalk.com --nginx --agree-tos --email tobinw@byu.edu